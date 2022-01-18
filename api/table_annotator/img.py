from typing import Tuple, List, Callable, TypeVar, Dict
import numpy as np
from scipy import ndimage

from table_annotator.types import Rectangle, Point, Table, CellGrid

BORDER_OFFSET = 5
ROW_COLUMN_WIDTH = 3

A = TypeVar('A')
B = TypeVar('B')


def cell_grid_to_list(cell_grid: CellGrid[A]) -> Tuple[List[A],
                                                       Dict[Tuple[int, int], int]]:
    """Turns a cell grid to a list and provides a mapping to invert the process."""
    cells = []
    mapping = {}
    for i in range(len(cell_grid)):
        for j in range(len(cell_grid[i])):
            mapping[(i, j)] = len(cells)
            cells.append(cell_grid[i][j])
    return cells, mapping


def list_to_cell_grid(cells: List[A],
                      mapping: Dict[Tuple[int, int], int]) -> CellGrid[A]:
    """Turns a list back into a cell grid using the mapping."""
    cell_grid = []
    last_i = None
    for i, j in sorted(list(mapping.keys())):
        if i != last_i:
            cell_grid.append([])
        cell_grid[i].append(cells[mapping[(i, j)]])
        last_i = i
    return cell_grid


def apply_to_cells(f: Callable[[A], B],
                   cells:  CellGrid[A]) -> CellGrid[B]:
    """Applies a function f to all cell images and returns the resulting cell images."""
    return [[f(cell) for cell in row] for row in cells]


def get_dimensions(image: np.ndarray) -> Tuple[int, int]:
    """Returns the width and height of the given image on disc."""
    return image.shape[1], image.shape[0]


def join_grid(cell_image_grid: CellGrid[np.ndarray]) -> np.ndarray:
    """Joins the images of the cells together."""
    row_images = []
    for row in cell_image_grid:
        row_images.append(
            np.concatenate(row, axis=1)
        )
    return np.concatenate(row_images, axis=0)


def drop_rows(cell_grid: CellGrid[A], rows: List[int]) -> CellGrid[A]:
    """Extracts rows of the CellGrid and returns a new CellGrid."""
    grid_rows = set(range(len(cell_grid)))
    remaining_grid_rows = sorted(list(grid_rows - set(rows)))
    return take_rows(cell_grid, remaining_grid_rows)


def drop_columns(cell_grid: CellGrid[A], columns: List[int]) -> CellGrid[A]:
    """Extracts rows of the CellGrid and returns a new CellGrid."""
    if len(cell_grid) == 0:
        return cell_grid

    grid_columns = set(range(len(cell_grid[0])))
    remaining_grid_columns = sorted(list(grid_columns - set(columns)))
    return take_columns(cell_grid, remaining_grid_columns)


def take_rows(cell_grid: CellGrid[A], rows: List[int]) -> CellGrid[A]:
    """Extracts rows of the CellGrid and returns a new CellGrid."""
    return [cell_grid[r] for r in rows if 0 <= r < len(cell_grid)]


def take_columns(cell_grid: CellGrid[A], columns: List[int]) -> CellGrid[A]:
    """Extracts columns of the CellGrid and returns a new CellGrid."""
    return [[cell_grid[r][c] for c in columns if 0 <= c < len(cell_grid[r])]
            for r in range(len(cell_grid))]


def crop(image: np.ndarray, rect: Rectangle) -> np.ndarray:
    """Extracts a rectangular part from the image."""
    return image[max(rect.topLeft.y, 0):max(rect.bottomRight.y, 0),
                 max(rect.topLeft.x, 0):max(rect.bottomRight.x, 0)]


def rotate(image: np.ndarray, degrees: float) -> np.ndarray:
    """Rotates an image by given degrees."""
    return ndimage.rotate(image, degrees, reshape=False, order=0)


def extract_table_image(image: np.ndarray, table: Table) -> np.ndarray:
    """Extracts the image part relating to the given table."""
    image_rotated_for_table = rotate(image, - table.rotationDegrees)
    offset = Point(x=BORDER_OFFSET, y=BORDER_OFFSET)
    return crop(image_rotated_for_table, table.outline.translate(offset))


def get_cell_grid(table: Table) -> CellGrid[Rectangle]:
    """Turns the columns and rows of a table into cell rectangles."""
    cells: List[List[Rectangle]] = []
    rows = [0] + table.rows + [table.outline.height()]
    columns = [0] + table.columns + [table.outline.width()]
    for r_i in range(len(rows) - 1):
        row_cells = []
        for c_i in range(len(columns) - 1):
            top_left = Point(x=columns[c_i],
                             y=rows[r_i])
            bottom_right = Point(x=columns[c_i + 1],
                                 y=rows[r_i + 1])
            row_cells.append(Rectangle(topLeft=top_left, bottomRight=bottom_right))
        cells.append(row_cells)
    return cells


def get_cell_image_grid(image: np.ndarray, table: Table) -> CellGrid[np.ndarray]:
    """Extracts cells as separate images."""
    table_image = extract_table_image(image, table)
    cell_image_grid = []
    for row in table.cellGrid or []:
        row_cells = []
        for cell in row:
            row_cells.append(crop(table_image, cell))
        cell_image_grid.append(row_cells)
    return cell_image_grid



