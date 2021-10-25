import argparse
from typing import Text
import os
import shutil
import functools
import numpy as np
import tqdm

import table_annotator.img
import table_annotator.io
from table_annotator.types import CellContent, TableContent


def table_ocr(image_path: Text, output_dir: Text):
    image = table_annotator.io.read_image(image_path)
    image_dpi = table_annotator.io.get_image_dpi(image_path)
    tables = table_annotator.io.read_tables_for_image(image_path)

    if len(tables) == 0:
        return

    file_base = os.path.splitext(os.path.basename(image_path))[0]

    for idx, t in enumerate(tables):
        # TODO: Early termination when nothing has changed
        output_folder_name = os.path.join(output_dir, file_base, f"{idx:02d}")
        debug_folder_name = os.path.join(output_folder_name, "debug")

        ocr_result_path = os.path.join(output_folder_name, "ocr_result.json")
        if os.path.exists(ocr_result_path):
            existing_table_content = \
                table_annotator.io.read_table_content(ocr_result_path)
            if any([cell.human_text for cell in existing_table_content.cells.values()]):
                print(f"Skipping table ocr for {output_folder_name} because human "
                      f"annotation already exists")
                continue

        if os.path.exists(output_folder_name):
            shutil.rmtree(output_folder_name)

        os.makedirs(output_folder_name, exist_ok=True)
        os.makedirs(debug_folder_name, exist_ok=True)



        cell_images = table_annotator.img.get_cell_image_grid(image, t)

        # pipeline
        binarized_cell_images = table_annotator.img.apply_to_cells(
            table_annotator.img.binarize, cell_images
        )
        cleaned_cell_images = table_annotator.img.apply_to_cells(
            table_annotator.img.remove_small_contours, binarized_cell_images
        )
        padded_cell_images = table_annotator.img.apply_to_cells(
            functools.partial(np.pad, pad_width=20, constant_values=255),
            cleaned_cell_images
        )

        # (disabled for now as it takes a long time with little benefit)
        # ocr_results = table_annotator.img.apply_to_cells(
        #     functools.partial(table_annotator.img.cell_image_to_text, dpi=image_dpi),
        #     padded_cell_images
        # )

        ocr_results = table_annotator.img.apply_to_cells(
            lambda x: "", padded_cell_images
        )

        cell_contents = table_annotator.img.apply_to_cells(
            CellContent.new_from_ocr_result, ocr_results
        )
        table_content = TableContent.from_cells(cell_contents)

        for i in range(len(cell_images)):
            for j in range(len(cell_images[i])):

                orig_dest_path = os.path.join(output_folder_name,
                                              f"{i:03d}_{j:03d}.jpg")
                table_annotator.io.write_image(orig_dest_path, cell_images[i][j])

                binarized_dest_path = os.path.join(debug_folder_name,
                                                   f"{i:03d}_{j:03d}_binarized.jpg")
                table_annotator.io.write_image(binarized_dest_path,
                                               binarized_cell_images[i][j])

                cleaned_dest_path = os.path.join(debug_folder_name,
                                                 f"{i:03d}_{j:03d}_cleaned.jpg")
                table_annotator.io.write_image(cleaned_dest_path,
                                               cleaned_cell_images[i][j])

                padded_dest_path = os.path.join(debug_folder_name,
                                                 f"{i:03d}_{j:03d}_padded.jpg")
                table_annotator.io.write_image(padded_dest_path,
                                               padded_cell_images[i][j])

        table_annotator.io.write_table_content(ocr_result_path, table_content)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract text from table cells')
    parser.add_argument("image_path",
                        help='Path to the image or folder of images you want to '
                             'extract tables for')
    parser.add_argument("output_dir",
                        help="Path to the directory used for output")

    args = parser.parse_args()
    if os.path.isdir(args.image_path):
        image_files = table_annotator.io.list_images(args.image_path)
        for image_file in tqdm.tqdm(image_files):
            table_ocr(os.path.join(args.image_path, image_file), args.output_dir)
    else:
        table_ocr(args.image_path, args.output_dir)



