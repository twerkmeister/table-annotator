from typing import Tuple, List, Callable, TypeVar, Dict
import numpy as np

from table_annotator.types import Rectangle, Point, Table, CellGrid, Cell
import table_annotator.img
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


def get_cell_rectangles(table: Table) -> CellGrid[Rectangle]:
    """Turns the columns and rows of a table into cell rectangles."""
    cell_rectangles = []
    rows = [0] + table.rows + [table.outline.height()]
    columns = [0] + table.columns + [table.outline.width()]
    for r_i in range(len(rows) - 1):
        row_of_cells: List[Rectangle] = []
        for c_i in range(len(columns) - 1):
            cell: Cell = table.cells[r_i][c_i]
            top_left = Point(x=columns[c_i] + (cell.left or 0),
                             y=rows[r_i] + (cell.top or 0))
            bottom_right = Point(x=columns[c_i + 1] + (cell.right or 0),
                                 y=rows[r_i + 1] + (cell.bottom or 0))
            row_of_cells.append(Rectangle(topLeft=top_left, bottomRight=bottom_right))
        cell_rectangles.append(row_of_cells)
    return cell_rectangles


def get_cell_image_grid(image: np.ndarray, table: Table, padding: int = 0) -> CellGrid[np.ndarray]:
    """Extracts cells as separate images."""
    table_image = table_annotator.img.extract_table_image(image, table)
    cell_image_grid = []
    for row in get_cell_rectangles(table):
        row_cells = []
        for cell in row:
            row_cells.append(table_annotator.img.crop(table_image, cell, padding))
        cell_image_grid.append(row_cells)
    return cell_image_grid
