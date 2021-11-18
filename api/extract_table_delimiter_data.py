import argparse
import os
from typing import Text, Callable, List
import random
import cv2
import numpy as np

import table_annotator.io
import table_annotator.img


def pixel_based_height(height: int) -> Callable[[int, int, List[int]], int]:
    def internal(r_i: int, jitter: int, row_px_delimiters: List[int]) -> int:
        return row_px_delimiters[r_i] + height + jitter
    return internal


def line_based_height(lines: int) -> Callable[[int, int, List[int]], int]:
    def internal(r_i: int, jitter: int, row_px_delimiters: List[int]) -> int:
        target_line = min(r_i + lines, len(row_px_delimiters) - 1)
        return row_px_delimiters[target_line]
    return internal


def extract_table_delimiter_data(data_path: Text, target_path: Text) -> None:
    """Extracts training data for table segmentation."""

    image_paths = table_annotator.io.list_images(data_path)
    full_image_paths = [os.path.join(data_path, ip) for ip in image_paths]
    locked_image_paths = [ip
                          for ip in full_image_paths
                          if table_annotator.io.is_image_locked(ip)]
    if len(locked_image_paths) == 0:
        print("No finished images found...")
        return

    os.makedirs(target_path, exist_ok=True)

    height_functions = [
        pixel_based_height(300),
        pixel_based_height(200),
        line_based_height(1),
        line_based_height(2),
        line_based_height(3),
    ]

    for image_path in locked_image_paths:
        img_name = os.path.splitext(os.path.basename(image_path))[0]
        image = table_annotator.io.read_image(image_path)
        tables = table_annotator.io.read_tables_for_image(image_path)
        for i, table in enumerate(tables):
            table_identifier = f"{img_name}_{i:02d}"
            table_image = table_annotator.img.extract_table_image(image, table)
            tasks = []
            row_px_delimiters = [0] + table.rows + [table_image.shape[0]]
            col_px_delimiters = [0] + table.columns + [table_image.shape[1]]

            for r_i, row_task_y_px_start in enumerate(row_px_delimiters[:-1]):
                for c_i in [-1] + list(range(len(col_px_delimiters)-2)):
                    if c_i == -1:
                        row_task_x_px_start = 0
                        row_task_x_px_end = table_image.shape[1]
                    else:
                        row_task_x_px_start = col_px_delimiters[c_i]
                        row_task_x_px_end = col_px_delimiters[c_i+2]

                    for h_i, height_func in enumerate(height_functions):
                        if r_i == 0:
                            jitter = random.randint(0, 6)
                        else:
                            jitter = random.randint(-4, 6)

                        row_task_y_px_start_tmp = row_task_y_px_start + jitter
                        row_task_y_px_end = height_func(r_i, jitter, row_px_delimiters)

                        row_task_x_px_start_tmp = max(0, row_task_x_px_start +
                                                      random.randint(-10, 20))
                        row_task_x_px_end_tmp = min(table_image.shape[1],
                                                    row_task_x_px_end +
                                                    random.randint(-10, 20))

                        row_task_image = \
                            table_image[row_task_y_px_start_tmp:row_task_y_px_end,
                                        row_task_x_px_start_tmp: row_task_x_px_end_tmp]

                        regression_target = row_px_delimiters[r_i+1] - \
                                            row_task_y_px_start_tmp

                        if regression_target >= row_task_image.shape[0] or \
                                r_i == len(row_px_delimiters) - 2:
                            regression_target = 0

                        decision_target = int(bool(regression_target))

                        row_task_targets = [regression_target,
                                            decision_target,
                                            jitter]

                        row_task_identifier = \
                            f"{table_identifier}_r{r_i:03d}_cm{c_i+1:02d}_h{h_i:02d}"
                        tasks.append((row_task_identifier, row_task_targets,
                                      row_task_image))

            written_images = set()
            for row_task_identifier, row_task_targets, row_task_image in tasks:
                if row_task_image.tobytes() in written_images:
                    continue

                row_task_image = np.copy(row_task_image)
                cv2.line(row_task_image,
                         (0, row_task_targets[0]),
                         (row_task_image.shape[1], row_task_targets[0]),
                         (0, 255, 0),
                         thickness=1)

                row_task_image_path = os.path.join(target_path,
                                                   f"{row_task_identifier}.jpg")
                row_task_targets_path = os.path.join(target_path,
                                                     f"{row_task_identifier}.txt")
                table_annotator.io.write_image(row_task_image_path, row_task_image)

                with open(row_task_targets_path, mode="w", encoding="utf-8") as rows_f:
                    rows_f.write(",".join([str(j) for j in row_task_targets]))

                written_images.add(row_task_image.tobytes())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extracts table delimiter examples'
                                                 'for table segmentation training.')
    parser.add_argument("data_path",
                        help='Path to the folder for which you want to extract '
                             'table data. Needs to be a workdir of the server,'
                             'i.e. a folder containing images.')

    parser.add_argument("target_path",
                        help='Path to the folder where you want to store the extracted '
                             'data')

    args = parser.parse_args()
    extract_table_delimiter_data(args.data_path, args.target_path)