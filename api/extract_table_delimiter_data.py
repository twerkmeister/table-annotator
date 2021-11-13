import argparse
import os
from typing import Text

import table_annotator.io
import table_annotator.img


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

    for image_path in locked_image_paths:
        img_name = os.path.splitext(os.path.basename(image_path))[0]
        image = table_annotator.io.read_image(image_path)
        tables = table_annotator.io.read_tables_for_image(image_path)
        for i, table in enumerate(tables):
            table_identifier = f"{img_name}_{i:02d}"
            cell_image_grid = table_annotator.img.get_cell_image_grid(image, table)

            for r_i in range(len(table.rows) + 1):
                three_row_cell_grid = table_annotator.img.take_rows(cell_image_grid,
                                                                    [r_i, r_i+1, r_i+2])
                row_task_image = \
                    table_annotator.img.join_grid(three_row_cell_grid)

                previous_offset = table.rows[r_i - 1] if r_i > 0 else 0

                row_task_targets = [table.rows[r_i] - previous_offset
                                    if r_i < len(table.rows) else 0,
                                    table.rows[r_i+1] - previous_offset
                                    if r_i+1 < len(table.rows) else 0]

                row_task_identifier = f"{table_identifier}_r{r_i:03d}"

                row_task_image_path = os.path.join(target_path,
                                                   f"{row_task_identifier}.jpg")
                row_task_targets_path = os.path.join(target_path,
                                                     f"{row_task_identifier}.txt")
                table_annotator.io.write_image(row_task_image_path, row_task_image)

                with open(row_task_targets_path, mode="w", encoding="utf-8") as rows_f:
                    rows_f.write(",".join([str(j) for j in row_task_targets]))

            for c_i in range(len(table.columns) + 1):
                three_col_cell_grid = table_annotator.img.take_columns(cell_image_grid,
                                                                       [c_i, c_i+1,
                                                                        c_i+2])
                col_task_image = \
                    table_annotator.img.join_grid(three_col_cell_grid)

                previous_offset = table.columns[c_i - 1] if c_i > 0 else 0

                col_task_targets = [table.columns[c_i] - previous_offset
                                    if c_i < len(table.columns) else 0,
                                    table.columns[c_i+1] - previous_offset
                                    if c_i+1 < len(table.columns) else 0]

                col_task_identifier = f"{table_identifier}_c{c_i:03d}"

                col_task_image_path = os.path.join(target_path,
                                                   f"{col_task_identifier}.jpg")
                col_task_targets_path = os.path.join(target_path,
                                                     f"{col_task_identifier}.txt")
                table_annotator.io.write_image(col_task_image_path, col_task_image)

                with open(col_task_targets_path, mode="w", encoding="utf-8") as cols_f:
                    cols_f.write(",".join([str(j) for j in col_task_targets]))


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