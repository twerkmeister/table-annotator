from typing import Tuple
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
    return ndimage.rotate(image, degrees, reshape=False, order=0)


def extract_table_image(image: np.ndarray, table: Table) -> np.ndarray:
    """Extracts the image part relating to the given table."""
    image_rotated_for_table = rotate(image, - table.rotationDegrees)
    offset = Point(x=BORDER_OFFSET, y=BORDER_OFFSET)
    return crop(image_rotated_for_table, table.outline.translate(offset))
