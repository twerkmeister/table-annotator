from typing import Optional

import pytest

from table_annotator.data_normalization.column_splitting import extract_date, \
    extract_characters


@pytest.mark.parametrize("text, expected_date", [
    ("23.03.24", "23.03.24"),
    ("23.03.24 Borgsund", "23.03.24"),
    ("Borgsund 23.03.24", "23.03.24"),
    ("223", None),
    (" 1. 2.93", " 1. 2.93"),
    ("33.01.44", None),
    ("01.13.31", None),
    ("01.13.131", None),
    ("111.92219", None)
])
def test_extract_date(text: str, expected_date: Optional[str]):
    assert extract_date(text) == expected_date


@pytest.mark.parametrize("text, expected_text",[
    ("23.03.24 Borgsund", "Borgsund"),
    ("1231.22119 Bergen", "Bergen"),
    ("1231.22119 Bergen, 1923", "Bergen"),
    ("geb. Mueller", "geb Mueller")
])
def test_extract_characters(text: str, expected_text: str):
    assert extract_characters(text) == expected_text