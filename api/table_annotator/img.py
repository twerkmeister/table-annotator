from typing import Tuple
import numpy as np
from scipy import ndimage

from table_annotator.types import Rectangle, Table


def get_image_dimensions(image: np.ndarray) -> Tuple[int, int]:
    """Returns the width and height of the given image on disc."""
    return image.shape[1], image.shape[0]


def get_image_rectangle(image: np.ndarray, rect: Rectangle) -> np.ndarray:
    """Extracts a rectangular part from the image."""
    return image[max(rect.topLeft.y, 0):max(rect.bottomRight.y, 0),
           max(rect.topLeft.x, 0):max(rect.bottomRight.x, 0)]


def rotate(image: np.ndarray, degrees: float) -> np.ndarray:
    """Rotates an image by given degrees."""
    return ndimage.rotate(image, degrees, reshape=False)


def extract_table(image: np.ndarray, table: Table) -> np.ndarray:
    """Extracts the image part relating to the given table."""
    image_rotated_for_table = rotate(image, - table.rotationDegrees)
    return get_image_rectangle(image_rotated_for_table, table.outline)