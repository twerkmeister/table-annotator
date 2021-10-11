from typing import Text, Tuple
import cv2
import numpy as np
from scipy import ndimage

from table_annotator.types import Rectangle


def read(image_path: Text) -> np.ndarray:
    """Reads an image from disc."""
    return cv2.imread(image_path)


def get_image_dimensions(image_path: Text) -> Tuple[int, int]:
    """Returns the width and height of the given image on disc."""
    img = read(image_path)
    return img.shape[1], img.shape[0]


def get_image_rectangle(image: np.ndarray, rect: Rectangle) -> np.ndarray:
    """Extracts a rectangular part from the image."""
    return image[max(rect.topLeft.y, 0):max(rect.bottomRight.y, 0),
           max(rect.topLeft.x, 0):max(rect.bottomRight.x, 0)]


def rotate(image: np.ndarray, degrees: float) -> np.ndarray:
    """Rotates an image by given degrees."""
    return ndimage.rotate(image, degrees, reshape=False)