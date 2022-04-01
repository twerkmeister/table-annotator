from typing import Text, List
import cv2
import requests
import numpy as np
import table_annotator.img
import table_annotator.cellgrid
import table_annotator.io

from table_annotator.types import Table, CellGrid, Cell


def table_ocr(image: np.ndarray, table: Table,
              overwrite: bool = False) -> CellGrid[Cell]:

    cell_image_grid = table_annotator.cellgrid.get_cell_image_grid(image, table)

    cells_copy = [[cell.copy() for cell in row] for row in table.cells]

    cell_list, _ = table_annotator.cellgrid.cell_grid_to_list(table.cells)

    needs_ocr: List[int] = list(range(len(cell_list))) if overwrite else \
        [i for i, c in enumerate(cell_list) if c.ocr_text is None]

    cell_images_list, mapping = \
        table_annotator.cellgrid.cell_grid_to_list(cell_image_grid)

    cell_images_list = [cv2.cvtColor(cell_image, cv2.COLOR_BGR2GRAY)
                        for cell_image in cell_images_list]
    cell_images_list_todo = [cell_images_list[i] for i in needs_ocr]
    images_serialized = [image.tolist()
                         for image in cell_images_list_todo]
    r = requests.post('http://localhost:5001/ocr',
                      json={"images": images_serialized})

    predictions: List[Text] = r.json()["predictions"]

    reversed_mapping = {v: k for k, v in mapping.items()}

    for prediction, idx in zip(predictions, needs_ocr):
        i, j = reversed_mapping[idx]
        cells_copy[i][j].ocr_text = prediction

    return cells_copy
