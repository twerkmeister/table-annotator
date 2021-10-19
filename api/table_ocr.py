import argparse
from typing import Text
import os
import shutil

import table_annotator.img
import table_annotator.io


def table_ocr(image_path: Text, output_dir: Text):
    image = table_annotator.io.read_image(image_path)
    tables = table_annotator.io.read_tables_for_image(image_path)

    if len(tables) == 0:
        return

    file_base = os.path.splitext(os.path.basename(image_path))[0]

    for idx, t in enumerate(tables):
        output_folder_name = os.path.join(output_dir, file_base, f"{idx:02d}")
        if os.path.exists(output_folder_name):
            shutil.rmtree(output_folder_name)
        os.makedirs(output_folder_name)
        cell_images, ocr_result = table_annotator.img.run_table_ocr(image, t)
        for i in range(len(cell_images)):
            for j in range(len(cell_images[i])):
                dest_path = os.path.join(output_folder_name, f"{i:03d}_{j:03d}.jpg")
                table_annotator.io.write_image(dest_path, cell_images[i][j])

        ocr_result_path = os.path.join(output_folder_name, "ocr_result.json")
        table_annotator.io.write_json(ocr_result_path, ocr_result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract text from table cells')
    parser.add_argument("image_path",
                        help='Path to the image you want to extract tables for')
    parser.add_argument("output_dir",
                        help="Path to the directory used for output")

    args = parser.parse_args()
    table_ocr(args.image_path, args.output_dir)

