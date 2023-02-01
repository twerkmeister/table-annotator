import csv
import os
import datetime
from typing import Dict, List, Optional

from table_annotator.types import Table, CellGrid, Cell

KEY_ORDER = "lCountId"
KEY_LAST_NAME = "strLName"
KEY_FIRST_NAME = "strGName"
KEY_DATE_OF_BIRTH = "strDoB"
KEY_PRISONER_NUMBER = "lNumber"
KEY_BIRTH_PLACE = "birthplace"

KEY_LAST_NAME_ANNOTATOR = "NACHNAME"
KEY_FIRST_NAME_ANNOTATOR = "VORNAME"
KEY_PRISONER_NUMBER_ANNOTATOR = "HAEFTLINGSNUMMER"
KEY_DATE_OF_BIRTH_ANNOTATOR = "GEBURTSDATUM"


def image_has_pre_annotated_data(image_path: str) -> bool:
    return os.path.isfile(pre_annotated_data_file_for_image(image_path))


def pre_annotated_data_file_for_image(image_path: str) -> str:
    return os.path.splitext(image_path)[0] + ".csv"


def read_pre_annotated_csv(image_path: str) -> List[Dict[str, str]]:
    csv_path = pre_annotated_data_file_for_image(image_path)
    with open(csv_path) as csvfile:
        reader = csv.DictReader(csvfile)
        return list(reader)


def find_column(table: Table, column_type: str) -> Optional[int]:
    try:
        return [column_type in cts for cts in table.columnTypes].index(True)
    except ValueError:
        return None

def transform_birthdate(date_normalized: str) -> str:
    dt = datetime.datetime.strptime(date_normalized, '%Y%m%d')
    return f"{dt.day}.{dt.month}.{dt.year%100:02d}"


def apply_pre_annotated_csv(image_path: str, table: Table, offset: int = 0) -> CellGrid[Cell]:
    lines = read_pre_annotated_csv(image_path)
    cells = table.cells
    required_lines = list(range(offset, offset+len(cells)))

    last_name_column = find_column(table, KEY_LAST_NAME_ANNOTATOR)
    first_name_column = find_column(table, KEY_FIRST_NAME_ANNOTATOR)
    prisoner_number_column = find_column(table, KEY_PRISONER_NUMBER_ANNOTATOR)
    birthdate_column = find_column(table, KEY_DATE_OF_BIRTH_ANNOTATOR)

    for line in lines:
        key = int(line[KEY_ORDER])
        if key not in required_lines:
            continue
        row = cells[key-offset]
        if last_name_column is not None and last_name_column == first_name_column:
            last_name_index = table.columnTypes[last_name_column].index(
                KEY_LAST_NAME_ANNOTATOR)
            first_name_index = table.columnTypes[last_name_column].index(
                KEY_FIRST_NAME_ANNOTATOR)
            if last_name_index < first_name_index:
                text = f"{line[KEY_LAST_NAME].title()} {line[KEY_FIRST_NAME].title()}"
            else:
                text = f"{line[KEY_FIRST_NAME].title()} {line[KEY_LAST_NAME].title()}"
            row[last_name_column].ocr_text = text
        else:
            if last_name_column is not None:
                row[last_name_column].ocr_text = line[KEY_LAST_NAME].title()
            if first_name_column is not None:
                row[first_name_column].ocr_text = line[KEY_FIRST_NAME].title()

        if prisoner_number_column is not None:
            row[prisoner_number_column].ocr_text = line[KEY_PRISONER_NUMBER]
        if birthdate_column is not None:
            row[birthdate_column].ocr_text = \
                transform_birthdate(line[KEY_DATE_OF_BIRTH])

    return cells
