from typing import Text
from pathlib import Path
import argparse
import os
import shutil
import table_annotator.img
import table_annotator.io
import cv2
import numpy as np


def crop_cell(images_path: Text, output_path: Text) -> None:
    """Crops a single line cell to the line."""
    image_paths = [str(path) for path in Path(images_path).rglob('**/*.jpg')]
    os.makedirs(output_path, exist_ok=True)
    for image_path in image_paths:
        image = table_annotator.io.read_image(image_path)
        image_name = os.path.basename(image_path)
        line_image = find_line_single(image)
        line_image_path = os.path.join(output_path, image_name)
        table_annotator.io.write_image(line_image_path, line_image)

        original_gt_path = image_path[:-3] + "gt.txt"
        target_gt_path = line_image_path[:-3] + "gt.txt"
        shutil.copy(original_gt_path, target_gt_path)


def find_line_single(image: np.ndarray, window_size: int = 25) -> np.ndarray:
    image_bw = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    image_inverted = cv2.bitwise_not(image_bw)
    image_as_column = np.sum(image_inverted, axis=1)

    window_values = [np.sum(image_as_column[idx:idx + window_size])
                     for idx in range(image_as_column.shape[0])]
    best_window_start = np.argmax(window_values)

    start = max(best_window_start - 5, 0)
    end = min(best_window_start + window_size + 5, image_as_column.shape[0])

    return image[start:end]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='crop cell lines')
    parser.add_argument("images_path",
                        help='folder with images to be cropped')
    parser.add_argument("output_path",
                        help='target folder.')

    args = parser.parse_args()
    crop_cell(args.images_path, args.output_path)
