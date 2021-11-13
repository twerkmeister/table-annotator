import functools
from typing import Tuple, List, Optional, Text, Callable, TypeVar
import numpy as np
from scipy import ndimage
import cv2
import pytesseract

import table_annotator.io
from table_annotator.types import Rectangle, Point, Table

BORDER_OFFSET = 5
ROW_COLUMN_WIDTH = 3

T = TypeVar('T')
A = TypeVar('A')
B = TypeVar('B')

CellGrid = List[List[T]]


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


def take_rows(cell_grid: CellGrid[A], rows: List[int]) -> CellGrid[A]:
    """Extracts rows of the CellGrid and returns a new CellGrid."""
    return [cell_grid[r] for r in rows]


def take_columns(cell_grid: CellGrid[A], columns: List[int]) -> CellGrid[A]:
    """Extracts columns of the CellGrid and returns a new CellGrid."""
    return [[cell_grid[r][c] for c in columns] for r in range(len(cell_grid))]


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
    cell_grid = get_cell_grid(table)
    cell_image_grid = []
    for row in cell_grid:
        row_cells = []
        for cell in row:
            row_cells.append(crop(table_image, cell))
        cell_image_grid.append(row_cells)
    return cell_image_grid


def cell_image_to_text(cell_image: np.ndarray, dpi: int) -> Text:
    """Uses pytesseract to extract text from binarized image."""
    whitelist = "abcdefghijklmnopqrstuvwxyz" \
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ" \
                ".,():;/-0123456789 "
    config = f"-l deu --dpi {dpi} -c tessedit_char_whitelist={whitelist}"
    return pytesseract.image_to_string(cell_image, config=config)


def binarize(image: np.ndarray) -> np.ndarray:
    """Binarize an image."""
    image_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    binarized = cv2.adaptiveThreshold(image_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                      cv2.THRESH_BINARY, 31, 10)
    return binarized


def remove_small_contours(image: np.ndarray) -> np.ndarray:
    """Removes contours that are smaller than the min area size."""
    contours = cv2.findContours(image, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    too_small_contours = [c for c in contours[0]
                          if cv2.contourArea(c) <= 20]
    mask = np.zeros(image.shape, dtype="uint8")

    cv2.drawContours(mask, too_small_contours, -1, 255, -1)
    return image + mask


@functools.lru_cache(maxsize=1000)
def get_table_image_bw(image_path: Text,
                       table_outline: Rectangle,
                       rotation_degrees: float) -> np.ndarray:
    image = table_annotator.io.read_image(image_path)
    image_rotated_for_table = rotate(image, - rotation_degrees)
    offset = Point(x=BORDER_OFFSET, y=BORDER_OFFSET)
    table_image = crop(image_rotated_for_table, table_outline.translate(offset))
    return cv2.cvtColor(table_image, cv2.COLOR_BGR2GRAY)


def predict_next_row_position(image_path: Text, table: Table) -> Optional[int]:
    """Guesses the position of the next row."""
    if len(table.rows) == 0:
        return None
    elif len(table.rows) == 1:
        last_row_height = table.rows[0]
    else:
        last_row_height = table.rows[-1] - table.rows[-2]

    table_image = get_table_image_bw(image_path, table.outline, table.rotationDegrees)

    last_row_position = table.rows[-1]
    search_area = 10  # px
    next_row_position_search_center = last_row_position + last_row_height
    candidate_row_positions = list(range(next_row_position_search_center - search_area,
                                         next_row_position_search_center + search_area))
    candidate_row_positions = [crp for crp in candidate_row_positions
                               if crp < table.outline.height()]

    if len(candidate_row_positions) == 0:
        return None

    row_positions = [last_row_position] + candidate_row_positions

    row_images = [table_image[row_pos:row_pos + ROW_COLUMN_WIDTH]
                  for row_pos in row_positions]

    row_images_discretized_counts = [np.histogram(row_img, bins=range(0, 256, 51))[0]
                                     for row_img in row_images]

    prev_row_discretized_counts = row_images_discretized_counts[0]
    candidate_rows_discretized_counts = row_images_discretized_counts[1:]

    similarities = [cosine_similarity(prev_row_discretized_counts, crdc)
                    for crdc in candidate_rows_discretized_counts]

    max_sim_position = np.argmax(similarities)

    return candidate_row_positions[max_sim_position]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.sqrt(np.dot(a, a)) * np.sqrt(np.dot(b, b)))


