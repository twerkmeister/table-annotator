from typing import Text, Tuple
import cv2


def get_image_dimensions(image_path: Text) -> Tuple[int, int]:
    """Returns the width and height of the given image."""
    img = cv2.imread(image_path)
    return img.shape[1], img.shape[0]
