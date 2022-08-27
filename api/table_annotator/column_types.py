from typing import Text, List
from table_annotator.types import Table

import table_annotator.io

def guess_column_types(image_path: Text,
                       tables: List[Table],
                       table_id: int) -> List[List[Text]]:
    """Tries to guess the column types for a table based on the previous table."""
    table = tables[table_id]
    column_types_guess = table.columnTypes
    previous_table = None
    if table_id == 0:
        # first table in this document... looking at previous document...
        maybe_previous_image = table_annotator.io.get_previous_image(image_path)
        if maybe_previous_image is not None:
            previous_tables = \
                table_annotator.io.read_tables_for_image(maybe_previous_image)
            if len(previous_tables) > 0:
                previous_table = previous_tables[-1]

    else:
        previous_table = tables[table_id - 1]

    if previous_table and len(previous_table.columnTypes) == len(table.columnTypes):
        column_types_guess = previous_table.columnTypes

    return column_types_guess
