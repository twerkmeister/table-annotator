from typing import Tuple, List
import numpy as np
from scipy import ndimage

from table_annotator.types import Rectangle, Point, Table

BORDER_OFFSET = 5
ROW_COLUMN_WIDTH = 3


def get_dimensions(image: np.ndarray) -> Tuple[int, int]:
    """Returns the width and height of the given image on disc."""
    return image.shape[1], image.shape[0]


def crop(image: np.ndarray, rect: Rectangle) -> np.ndarray:
    """Extracts a rectangular part from the image."""
    return image[max(rect.topLeft.y, 0):max(rect.bottomRight.y, 0),
           max(rect.topLeft.x, 0):max(rect.bottomRight.x, 0)]


def rotate(image: np.ndarray, degrees: float) -> np.ndarray:
    """Rotates an image by given degrees."""
    return ndimage.rotate(image, degrees, reshape=False)


def extract_table(image: np.ndarray, table: Table) -> np.ndarray:
    """Extracts the image part relating to the given table."""
    image_rotated_for_table = rotate(image, - table.rotationDegrees)
    offset = Point(x=BORDER_OFFSET, y=BORDER_OFFSET)
    return crop(image_rotated_for_table, table.outline.translate(offset))


def get_cell_grid(table: Table) -> List[List[Rectangle]]:
    """Turns the columns and rows of a table into cell rectangles."""
    cells = []
    rows = [0] + table.rows + [table.outline.height()]
    columns = [0] + table.columns + [table.outline.width()]
    for r_i in range(len(rows)-1):
        cells.append([])
        for c_i in range(len(columns)-1):
            top_left = Point(x=columns[c_i],
                             y=rows[r_i])
            bottom_right = Point(x=columns[c_i+1],
                                 y=rows[r_i+1])
            cells[-1].append(Rectangle(topLeft=top_left, bottomRight=bottom_right))
    return cells


def get_cell_image_grid(image: np.ndarray, table: Table) -> List[List[np.ndarray]]:
    """Extracts cells as separate images."""
    table_image = extract_table(image, table)
    cell_grid = get_cell_grid(table)
    cell_image_grid = []
    for row in cell_grid:
        cell_image_grid.append([])
        for cell in row:
            cell_image_grid[-1].append(crop(table_image, cell))
    return cell_image_grid


def get_row_line_image_parts(image: np.ndarray, table: Table) -> List[np.ndarray]:
    """Extracts the image parts that correspond to the row lines.

    This is useful for guessing the next row position."""
    table_image = extract_table(image, table)
    return [
        table_image[row_pos:row_pos + ROW_COLUMN_WIDTH] for row_pos in table.rows
    ]
