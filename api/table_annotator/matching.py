import csv
import os
import functools
from collections import defaultdict
from typing import Optional

import pandas as pd
from Levenshtein import ratio
import numpy as np

from table_annotator import cellgrid
from table_annotator.constants import KEY_LAST_NAME, KEY_FIRST_NAME, KEY_DATE_OF_BIRTH, \
    KEY_LAST_NAME_ANNOTATOR, KEY_FIRST_NAME_ANNOTATOR, KEY_DATE_OF_BIRTH_ANNOTATOR, \
    KEY_PRISONER_NUMBER_ANNOTATOR, KEY_PRISONER_NUMBER, KEY_DATE_OF_BIRTH_YEAR, \
    KEY_DATE_OF_BIRTH_MONTH, KEY_DATE_OF_BIRTH_DAY, KEY_NUMBER_SHORTENING_ANNOTATOR
from table_annotator.data_normalization.column_processing import normalize_last_name, \
    normalize_first_name, normalise_date, resolve_number_shortening, \
    normalise_prisoner_number
from table_annotator.data_normalization.column_splitting import extract_date, \
    extract_characters
from table_annotator.types import Table, DataMatch

SEPARATOR = ";"


@functools.cache
def read_persdata_index(path: str) -> dict[str, list[dict]]:
    results = defaultdict(list)
    with open(path, encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile, delimiter="|")
        for row in reader:
            if row[KEY_LAST_NAME] and (number := row[KEY_PRISONER_NUMBER]) and \
                    (date_of_birth := row[KEY_DATE_OF_BIRTH]):
                year = date_of_birth[:4]
                month = date_of_birth[4:6]
                day = date_of_birth[6:8]
                if year == "0000":
                    year = ""
                if month == "00":
                    month = ""
                if day == "00":
                    day = ""
                row[KEY_DATE_OF_BIRTH_YEAR] = year
                row[KEY_DATE_OF_BIRTH_MONTH] = month
                row[KEY_DATE_OF_BIRTH_DAY] = day
                row[KEY_LAST_NAME] = row[KEY_LAST_NAME].title()
                row[KEY_FIRST_NAME] = row[KEY_FIRST_NAME].title()
                results[number].append(row)
    return results


def score(s1: str, s2: str):
    return ratio(s1.upper(), s2.upper())


def find_column_single(table: Table, column_type: str) -> Optional[int]:
    try:
        return [column_type in cts and len(cts) == 1
                for cts in table.columnTypes].index(True)
    except ValueError:
        return None


def match_entry(last_name: str, first_name: str, date_of_birth: str, number: str,
                persdata_index: dict[str, list[dict]],
                threshold: float = 0.8) -> Optional[DataMatch]:
    """Match an entry against persdata index and return highest match if any."""
    final_match = None
    for potential_match in persdata_index.get(number, []):
        last_name_score = score(last_name, potential_match[KEY_LAST_NAME])
        given_name_score = score(first_name, potential_match[KEY_FIRST_NAME])
        # TODO: get cleaned parts
        year_score = score(date_of_birth, potential_match[KEY_DATE_OF_BIRTH])
        combined_score = np.average([last_name_score, given_name_score, year_score])
        if combined_score >= threshold:
            final_match = DataMatch(score=combined_score, data=potential_match)
            threshold = combined_score
    return final_match


def match_table(table: Table, persdata_index: dict[str, list[dict]]
                ) -> Optional[list[Optional[DataMatch]]]:
    df = table_data_to_df(table)
    if KEY_LAST_NAME_ANNOTATOR not in df or KEY_FIRST_NAME_ANNOTATOR not in df or \
        KEY_DATE_OF_BIRTH_ANNOTATOR not in df or KEY_PRISONER_NUMBER_ANNOTATOR not in df:
        return None

    normalized_last_names = normalize_last_name(df, KEY_LAST_NAME_ANNOTATOR, "x")
    normalized_first_names = normalize_first_name(df, KEY_FIRST_NAME_ANNOTATOR, "x")
    normalized_birth_dates = normalise_date(df, KEY_DATE_OF_BIRTH_ANNOTATOR, "DOB", "x",
                                           [1850, 1950])
    normalized_prisoner_numbers = \
        normalise_prisoner_number(df, KEY_PRISONER_NUMBER_ANNOTATOR, "x")

    matches = []
    for i in range(len(df)):
        last_name = normalized_last_names["last_name_cleaned_1"][i]
        first_name = normalized_first_names["first_name_cleaned_1"][i]
        prisoner_number = normalized_prisoner_numbers["prisoner_number_trim_1"][i]
        birth_date_year = normalized_birth_dates["DOB_year_cleaned"][i]
        birth_date_month = normalized_birth_dates["DOB_month_cleaned"][i]
        birth_date_day = normalized_birth_dates["DOB_day_cleaned"][i]
        if birth_date_year == "":
            birth_date_year = "____"
        if birth_date_month == "":
            birth_date_month = "__"
        if birth_date_day == "":
            birth_date_day = "__"
        birth_date = birth_date_year + birth_date_month + birth_date_day

        match = match_entry(last_name,
                            first_name,
                            birth_date,
                            prisoner_number,
                            persdata_index)
        matches.append(match)
    return matches

def table_data_to_df(table: Table) -> pd.DataFrame:
    text_grid = cellgrid.apply_to_cells(lambda x: x.extract_clean_text(), table.cells)
    columns = [SEPARATOR.join(types) for types in table.columnTypes]
    df = pd.DataFrame.from_records(text_grid, columns=columns)
    df = split_columns(df)
    return df


def split_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Split columns containing multiple data types."""
    multi_field_columns = [c for c in df.columns if SEPARATOR in c]
    for c in multi_field_columns:
        split_fields = c.split(SEPARATOR)
        date_fields = [f for f in split_fields if "DATUM" in f]
        # The case when there is one date field and one text field combined
        if len(split_fields) == 2 and len(date_fields) == 1:
            for field in split_fields:
                if "DATUM" in field:
                    df[field] = df[c].apply(extract_date, convert_dtype=False)
                else:
                    df[field] = df[c].apply(extract_characters)
        # deal with shortened numbers
        if len(split_fields) == 2 and KEY_PRISONER_NUMBER_ANNOTATOR in c and \
                KEY_NUMBER_SHORTENING_ANNOTATOR in c:
            df = resolve_number_shortening(df, c, KEY_PRISONER_NUMBER_ANNOTATOR)
    return df