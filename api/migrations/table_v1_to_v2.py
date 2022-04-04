import argparse
import os
from typing import Text, Optional, List
from pydantic import BaseModel

from table_annotator.types import Table as TableV2, Rectangle, CellGrid, Cell
import table_annotator.cellgrid
import table_annotator.io


class CellContent(BaseModel):
    ocr_text: Text
    human_text: Optional[Text]

    @classmethod
    def new_from_ocr_result(cls, ocr_result: Text):
        return cls(ocr_text=ocr_result, human_text=None)

    @staticmethod
    def extract_text(cell_content: "CellContent") -> Text:
        return cell_content.human_text if cell_content.human_text is not None \
            else cell_content.ocr_text


class TableV1(BaseModel):
    outline: Rectangle
    rotationDegrees: float
    columns: List[int]
    rows: List[int]
    cellGrid: Optional[CellGrid[Rectangle]]
    cellContents: Optional[CellGrid[CellContent]]
    columnTypes: Optional[List[List[Text]]]

    def __hash__(self) -> int:
        cell_outlines = tuple([cell for row in self.cellGrid for cell in row])
        return hash((self.outline, self.rotationDegrees,
                     tuple(self.rows), tuple(self.columns),
                     tuple(cell_outlines)))


def read_tables_v1_for_image(image_path: Text) -> List[TableV1]:
    json_file_path = os.path.splitext(image_path)[0] + ".json"
    if not os.path.isfile(json_file_path):
        return []
    else:
        return [TableV1(**t) for t in table_annotator.io.read_json(json_file_path)]


def migrate(table: TableV1) -> TableV2:
    column_types = table.columnTypes if table.columnTypes is not None \
        else [[] for _ in range(len(table.columns) + 1)]
    cells = []
    if table.cellGrid is None:
        for i in range(len(table.rows) + 1):
            row = []
            for j in range(len(table.columns) + 1):
                row.append(Cell())
            cells.append(row)
    else:
        all_columns = [0] + table.columns + [table.outline.width()]
        all_rows = [0] + table.rows + [table.outline.height()]

        for i, row_pos in enumerate(all_rows[:-1]):
            row = []
            for j, col_pos in enumerate(all_columns[: -1]):
                base_top = row_pos
                base_right = all_columns[j+1]
                base_bottom = all_rows[i+1]
                base_left = col_pos

                cell_top = table.cellGrid[i][j].topLeft.y
                cell_right = table.cellGrid[i][j].bottomRight.x
                cell_bottom = table.cellGrid[i][j].bottomRight.y
                cell_left = table.cellGrid[i][j].topLeft.x

                top = cell_top - base_top
                right = cell_right - base_right
                bottom = cell_bottom - base_bottom
                left = cell_left - base_left

                ocr_text = table.cellContents[i][j].ocr_text \
                    if table.cellContents is not None else None

                human_text = table.cellContents[i][j].human_text \
                    if table.cellContents is not None else None

                row.append(Cell(top=top or None, right=right or None,
                                bottom=bottom or None, left=left or None,
                                ocr_text=ocr_text, human_text=human_text))
            cells.append(row)
    return TableV2(cells=cells, rows=table.rows, columns=table.columns,
                   outline=table.outline, columnTypes=column_types,
                   rotationDegrees=table.rotationDegrees, structureLocked=True)


def migrate_table_v1_to_v2(data_path: Text) -> None:
    """Extracts ocr data points to a simpler file format."""
    image_paths = [os.path.join(data_path, image_path)
                   for image_path in table_annotator.io.list_images(data_path)]
    tables_v1_for_images = [read_tables_v1_for_image(image_path)
                         for image_path in image_paths]

    for image_path, tables_v1 in zip(image_paths, tables_v1_for_images):
        tables_v2 = [migrate(t) for t in tables_v1]
        table_annotator.io.write_tables_for_image(image_path, tables_v2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Converts v1 table structure into v2.")
    parser.add_argument("data_path",
                        help='Path to the folder which you want to extract. '
                             'Needs to be a workdir of the server, '
                             'i.e. a folder containing images.')


    args = parser.parse_args()
    migrate_table_v1_to_v2(args.data_path)