import re
import itertools
from typing import Optional

variants_day = [
    r"[3][01]",
    r"[1-2][0-9]",
    r"(0| )[1-9]",
]

variants_month = [
    r"1[0-2]",
    r"(0| )?[1-9]",
]

variants_year = [
    r"1[89][0-9]{2}",
    r"[0-9]{2}",
]

variants_separator = [
    r"\.",
    r"-",
]

date_regexes = [
    re.compile(rf"{day}{separator}{month}{separator}{year}")
    for day, month, year, separator in
    itertools.product(variants_day, variants_month, variants_year, variants_separator)
]

def extract_date(s: str) -> Optional[str]:
    """Extract the date from a longer string."""

    for date_regex in date_regexes:
        match = date_regex.search(s)
        if match:
            return match.group(0)

    return None

def extract_characters(text: str) -> str:
    """Extract the characters from a string."""
    non_characters = re.compile(r"[^a-zA-Z ]")
    return non_characters.sub("", text).strip()