import argparse
import os
from typing import Text, Callable, List

import cv2

import table_annotator.io
import table_annotator.img


def total_height(height: int) -> Callable[[int, List[int]], int]:
    def internal(r_i: int, row_px_delimiters: List[int]) -> int:
        return row_px_delimiters[r_i] + height
    return internal


def line_based_height(lines: int) -> Callable[[int, List[int]], int]:
    def internal(r_i: int, row_px_delimiters: List[int]) -> int:
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
        total_height(300),
        total_height(200),
        total_height(100),
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

            for r_i, row_task_px_start in enumerate(row_px_delimiters[:-1]):
                for h_i, height_func in enumerate(height_functions):
                    row_task_px_end = height_func(r_i, row_px_delimiters)

                    row_task_image = table_image[row_task_px_start:row_task_px_end]

                    regression_target = row_px_delimiters[r_i+1] - row_task_px_start

                    if regression_target >= row_task_image.shape[0] or \
                            r_i == len(row_px_delimiters) - 2:
                        regression_target = 0

                    decision_target = int(bool(regression_target))

                    row_task_targets = [regression_target,
                                        decision_target]

                    row_task_identifier = f"{table_identifier}_r{r_i:03d}_h{h_i:02d}"
                    tasks.append((row_task_identifier, row_task_targets, row_task_image))

            written_images = set()
            for row_task_identifier, row_task_targets, row_task_image in tasks:
                if row_task_image.tobytes() in written_images:
                    continue

                # cv2.line(row_task_image,
                #          (0, row_task_targets[0]),
                #          (row_task_image.shape[1], row_task_targets[0]),
                #          (0, 255, 0),
                #          thickness=3)

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