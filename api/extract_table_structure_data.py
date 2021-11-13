import argparse
import os
from typing import Text

import table_annotator.io
import table_annotator.img


def extract_table_structure_data(data_path: Text, target_path: Text) -> None:
    """Extracts table structure data for further processing."""
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
            table_image_target_path = os.path.join(target_path,
                                                   f"{table_identifier}.jpg")
            columns_file = os.path.join(target_path, f"{table_identifier}.columns.txt")
            rows_file = os.path.join(target_path, f"{table_identifier}.rows.txt")

            table_image = table_annotator.img.extract_table_image(image, table)

            table_annotator.io.write_image(table_image_target_path, table_image)

            with open(columns_file, mode="w", encoding="utf-8") as columns_f:
                columns_f.write(",".join([str(j) for j in table.columns]))

            with open(rows_file, mode="w", encoding="utf-8") as rows_f:
                rows_f.write(",".join([str(j) for j in table.rows]))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extracts table structure data '
                                                 'for easier '
                                                 'downstream processing')
    parser.add_argument("data_path",
                        help='Path to the folder for which you want to extract '
                             'table data. Needs to be a workdir of the server,'
                             'i.e. a folder containing images.')

    parser.add_argument("target_path",
                        help='Path to the folder where you want to store the extracted '
                             'data')

    args = parser.parse_args()
    extract_table_structure_data(args.data_path, args.target_path)