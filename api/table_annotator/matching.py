import csv
import functools
from collections import defaultdict
from typing import Optional
from Levenshtein import ratio
import numpy as np

from table_annotator.types import Table, DataMatch

PERS_LAST_NAME = "strLName"
PERS_FIRST_NAME = "strGName"
PERS_DATE_OF_BIRTH = "strDoB"
PERS_DATE_OF_BIRTH_YEAR = "strDoBYear"
PERS_DATE_OF_BIRTH_MONTH = "strDoBMonth"
PERS_DATE_OF_BIRTH_DAY = "strDoBDay"
PERS_NUMBER = "strNumber"

KEY_LAST_NAME_ANNOTATOR = "NACHNAME"
KEY_FIRST_NAME_ANNOTATOR = "VORNAME"
KEY_PRISONER_NUMBER_ANNOTATOR = "HAEFTLINGSNUMMER"
KEY_DATE_OF_BIRTH_ANNOTATOR = "GEBURTSDATUM"


@functools.cache
def read_persdata_index(path: str) -> dict[str, list[dict]]:
    results = defaultdict(list)
    with open(path) as csvfile:
        reader = csv.DictReader(csvfile, delimiter="|")
        for row in reader:
            if row[PERS_LAST_NAME] and (number := row[PERS_NUMBER]) and \
                    (date_of_birth := row[PERS_DATE_OF_BIRTH]):
                year = date_of_birth[:4]
                month = date_of_birth[4:6]
                day = date_of_birth[6:8]
                if year == "0000":
                    year = ""
                if month == "00":
                    month = ""
                if day == "00":
                    day = ""
                row[PERS_DATE_OF_BIRTH_YEAR] = year
                row[PERS_DATE_OF_BIRTH_MONTH] = month
                row[PERS_DATE_OF_BIRTH_DAY] = day
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
        last_name_score = score(last_name, potential_match[PERS_LAST_NAME])
        given_name_score = score(first_name, potential_match[PERS_FIRST_NAME])
        # TODO: get cleaned parts
        year_score = score(date_of_birth, potential_match[PERS_DATE_OF_BIRTH])
        combined_score = np.average([last_name_score, given_name_score, year_score])
        if combined_score >= threshold:
            final_match = DataMatch(score=combined_score, data=potential_match)
            threshold = combined_score
    return final_match


def match_table(table: Table, persdata_index: dict[str, list[dict]]
                ) -> Optional[list[Optional[DataMatch]]]:
    last_name_column = find_column_single(table, KEY_LAST_NAME_ANNOTATOR)
    first_name_column = find_column_single(table, KEY_FIRST_NAME_ANNOTATOR)
    date_of_birth_column = find_column_single(table, KEY_DATE_OF_BIRTH_ANNOTATOR)
    number_column = find_column_single(table, KEY_PRISONER_NUMBER_ANNOTATOR)
    if last_name_column is None or first_name_column is None or \
            date_of_birth_column is None or number_column is None:
        return None

    matches = []
    for row in table.cells:
        match = match_entry(row[last_name_column].extract_text(),
                            row[first_name_column].extract_text(),
                            row[date_of_birth_column].extract_text(),
                            row[number_column].extract_text(),
                            persdata_index)
        matches.append(match)
    return matches


