from typing import Tuple
import numpy as np
from scipy import ndimage

from table_annotator.types import Rectangle, Point, Table

BORDER_OFFSET = 5
ROW_COLUMN_WIDTH = 3


def get_dimensions(image: np.ndarray) -> Tuple[int, int]:
    """Returns the width and height of the given image on disc."""
    return image.shape[1], image.shape[0]


def crop(image: np.ndarray, rect: Rectangle, padding: int = 0) -> np.ndarray:
    """Extracts a rectangular part from the image."""
    p = padding
    return image[max(rect.topLeft.y-p, 0):min(rect.bottomRight.y+p, image.shape[0]),
                 max(rect.topLeft.x-p, 0):min(rect.bottomRight.x+p, image.shape[1])]


def rotate(image: np.ndarray, degrees: float) -> np.ndarray:
    """Rotates an image by given degrees."""
    return ndimage.rotate(image, degrees, reshape=False, order=0)


def extract_table_image(image: np.ndarray, table: Table) -> np.ndarray:
    """Extracts the image part relating to the given table."""
    image_rotated_for_table = rotate(image, - table.rotationDegrees)
    offset = Point(x=BORDER_OFFSET, y=BORDER_OFFSET)
    return crop(image_rotated_for_table, table.outline.translate(offset))
