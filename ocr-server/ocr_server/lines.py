from typing import List

import numpy as np
import cv2
import scipy.signal


def find_lines(image: np.ndarray) -> List[np.ndarray]:
    """Split a cell image into multiple text lines."""
    window_size = 30
    image_blurred = cv2.medianBlur(image, 5)
    image_inverted = cv2.bitwise_not(image_blurred)
    image_squeezed = np.sum(image_inverted, axis=1)
    image_horizontal_squared_diffs = \
        np.sum(np.square(np.diff(image_inverted, axis=1)), axis=1)
    image_squeezed = image_squeezed + image_horizontal_squared_diffs
    gaussian_window = scipy.signal.windows.gaussian(window_size, 5)
    values = np.convolve(image_squeezed, gaussian_window, 'same')
    value_diffs = np.diff(values)
    diff_signs = np.sign(value_diffs)
    sign_diffs = np.diff(diff_signs)
    local_maxima = [i for i, sign_diff in enumerate(sign_diffs) if sign_diff == -2]
    local_maxima = [local_maximum for local_maximum in local_maxima
                    if local_maximum > 8 and local_maximum + 8 < image.shape[0]]

    lines = []
    for local_maximum in local_maxima:
        start = max(local_maximum - 15, 0)
        end = min(local_maximum + 15, image.shape[0])
        lines.append(image[start:end])

    return lines
