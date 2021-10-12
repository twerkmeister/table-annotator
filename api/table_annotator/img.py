from typing import Tuple, List, Optional
import numpy as np
from scipy import ndimage
import cv2

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


def predict_next_row_position(image: np.ndarray, table: Table) -> Optional[int]:
    """Guesses the position of the next row."""
    if len(table.rows) == 0:
        return None
    elif len(table.rows) == 1:
        last_row_height = table.rows[0]
    else:
        last_row_height = table.rows[-1] - table.rows[-2]

    table_image = extract_table(image, table)

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

    row_images_bw = [cv2.cvtColor(row_img, cv2.COLOR_BGR2GRAY)
                     for row_img in row_images]

    row_images_discretized_counts = [np.histogram(row_img, 10)[0]
                                     for row_img in row_images_bw]

    prev_row_discretized_counts = row_images_discretized_counts[0]
    candidate_rows_discretized_counts = row_images_discretized_counts[1:]

    similarities = [cosine_similarity(prev_row_discretized_counts, crdc)
                    for crdc in candidate_rows_discretized_counts]

    max_sim_position = np.argmax(similarities)

    return candidate_row_positions[max_sim_position]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.sqrt(np.dot(a, a)) * np.sqrt(np.dot(b, b)))
