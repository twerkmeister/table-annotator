from typing import Text, List
import cv2
import requests
import numpy as np
import table_annotator.img
import table_annotator.cellgrid
import table_annotator.io

from table_annotator.types import Table, CellGrid, CellContent


def table_ocr(image: np.ndarray, table: Table) -> CellGrid[CellContent]:

    cell_image_grid = table_annotator.cellgrid.get_cell_image_grid(image, table)

    cell_images_list, mapping = \
        table_annotator.cellgrid.cell_grid_to_list(cell_image_grid)
    cell_images_list = [cv2.cvtColor(cell_image, cv2.COLOR_BGR2GRAY)
                        for cell_image in cell_images_list]

    images_serialized = [image.tolist()
                         for image in cell_images_list]
    r = requests.post('http://localhost:5001/ocr',
                      json={"images": images_serialized})

    predictions: List[Text] = r.json()["predictions"]

    ocr_results = table_annotator.cellgrid.list_to_cell_grid(
        predictions, mapping)

    cell_contents = table_annotator.cellgrid.apply_to_cells(
        CellContent.new_from_ocr_result, ocr_results
    )

    return cell_contents
