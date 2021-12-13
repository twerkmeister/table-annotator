from typing import Text, List
import argparse
from pathlib import Path
import table_annotator.img
import table_annotator.io
import cv2
import numpy as np
import scipy.signal
import textwrap


def find_line(images_path: Text) -> None:
    """blurs lines."""
    image_paths = [str(path) for path in Path(images_path).rglob('**/*.jpg')]
    for image_path in image_paths:
        image = table_annotator.io.read_image(image_path)
        line_image = find_line_single(image)
        line_image_path = image_path[:-4] + "_line.jpg"
        table_annotator.io.write_image(line_image_path, line_image)


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


def find_all_lines(images_path: Text) -> None:
    image_paths = [str(path) for path in Path(images_path).rglob('**/*.jpg')]
    oversegmentations = 0
    undersegmentations = 0
    correct_segmentations = 0
    for image_path in image_paths:
        image = table_annotator.io.read_image(image_path)
        ground_truth_path = f"{image_path[:-4]}.gt.txt"
        ground_truth = open(ground_truth_path).readlines()
        line_images = find_lines(image)
        if len(ground_truth) < len(line_images):
            oversegmentations += 1
            for i, line_image in enumerate(line_images):
                line_image_path = f"{image_path[:-4]}_line_over_{i:02d}.jpg"
                table_annotator.io.write_image(line_image_path, line_image)
        elif len(ground_truth) > len(line_images):
            undersegmentations += 1
            for i, line_image in enumerate(line_images):
                line_image_path = f"{image_path[:-4]}_line_under_{i:02d}.jpg"
                table_annotator.io.write_image(line_image_path, line_image)
        else:
            correct_segmentations += 1
            for i, line_image in enumerate(line_images):
                line_image_path = f"{image_path[:-4]}_line_correct_{i:02d}.jpg"
                table_annotator.io.write_image(line_image_path, line_image)

    print(textwrap.dedent(f"""
        total: {len(image_paths)}
        correct: {correct_segmentations}
        oversegmented: {oversegmentations}
        undersegmented: {undersegmentations}"""))


def find_lines(image: np.ndarray) -> List[np.ndarray]:
    window_size = 30
    image_bw = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    image_blurred = cv2.medianBlur(image_bw, 5)
    image_inverted = cv2.bitwise_not(image_blurred)
    image_squeezed = np.sum(image_inverted, axis=1)
    image_horizontal_squared_diffs = \
        np.sum(np.square(np.diff(image_inverted, axis=1)), axis=1)
    image_squeezed = image_squeezed + image_horizontal_squared_diffs
    gaussian_window = scipy.signal.windows.gaussian(window_size, 5)
    smaller_gaussian_window = scipy.signal.windows.gaussian(window_size//2, 2.5)
    # dual_gaussian_window = np.concatenate([smaller_gaussian_window, smaller_gaussian_window])
    values = np.convolve(image_horizontal_squared_diffs, gaussian_window, 'same')
    # values += np.convolve(image_squeezed, dual_gaussian_window, 'same')
    value_diffs = np.diff(values)
    diff_signs = np.sign(value_diffs)
    sign_diffs = np.diff(diff_signs)
    local_maxima = [i for i, sign_diff in enumerate(sign_diffs) if sign_diff == -2]
    local_maxima = [local_maximum for local_maximum in local_maxima
                    if local_maximum > 8 and local_maximum + 8 < image.shape[0]]

    # valid_local_maxima = []
    # for local_maximum in local_maxima:
    #     if len(valid_local_maxima) == 0 or local_maximum - valid_local_maxima[-1] >= 15:
    #         valid_local_maxima.append(local_maximum)

    lines = []
    for local_maximum in local_maxima:
        start = max(local_maximum - 15, 0)
        end = min(local_maximum + 15, image.shape[0])
        lines.append(image[start:end])

    return lines


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='find line')
    parser.add_argument("images_path",
                        help='folder with images to be analyzed')

    args = parser.parse_args()
    find_all_lines(args.images_path)
