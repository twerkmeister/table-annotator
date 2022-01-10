import argparse
from typing import Text, List
import os
import pickle
import shutil
import tqdm
import cv2
import requests

import table_annotator.img
import table_annotator.io
import table_annotator.ocr
from table_annotator.types import CellContent, TableContent


def table_ocr(image_path: Text, force_overwrite: bool = False):

    image = table_annotator.io.read_image(image_path)
    tables = table_annotator.io.read_tables_for_image(image_path)

    print(f"Started table ocr for {image_path}")

    if len(tables) == 0:
        print("No tables, stopping ...")
        return

    file_base = os.path.splitext(os.path.basename(image_path))[0]
    dirname = os.path.dirname(image_path)
    for idx, t in enumerate(tables):
        # TODO: Early termination when nothing has changed
        output_folder_name = os.path.join(dirname, file_base, f"{idx:02d}")
        debug_folder_name = os.path.join(output_folder_name, "debug")

        ocr_result_path = os.path.join(output_folder_name, "ocr_result.json")
        if os.path.exists(ocr_result_path):
            existing_table_content = \
                table_annotator.io.read_table_content(ocr_result_path)
            if not force_overwrite and \
                    any([cell.human_text
                        for cell in existing_table_content.cells.values()]):
                print(f"Skipping table ocr for {output_folder_name} because human "
                      f"annotation already exists and overwrite wasn't forced")
                continue

        if os.path.exists(output_folder_name):
            shutil.rmtree(output_folder_name)

        os.makedirs(output_folder_name, exist_ok=True)
        os.makedirs(debug_folder_name, exist_ok=True)

        cell_image_grid = table_annotator.img.get_cell_image_grid(image, t)

        cell_images_list, mapping = \
            table_annotator.img.cell_grid_to_list(cell_image_grid)
        cell_images_list = [cv2.cvtColor(cell_image, cv2.COLOR_BGR2GRAY)
                            for cell_image in cell_images_list]

        images_serialized = [image.tolist()
                             for image in cell_images_list]
        r = requests.post('http://localhost:5001/ocr',
                          json={"images": images_serialized})

        predictions: List[Text] = r.json()["predictions"]

        predictions_without_empty_lines = [
            prediction.replace("␢\n", "").replace("\n␢", "")
            for prediction in predictions
        ]

        ocr_results = table_annotator.img.list_to_cell_grid(
            predictions_without_empty_lines, mapping)

        cell_contents = table_annotator.img.apply_to_cells(
            CellContent.new_from_ocr_result, ocr_results
        )
        table_content = TableContent.from_cells(cell_contents)

        for i in range(len(cell_image_grid)):
            for j in range(len(cell_image_grid[i])):

                orig_dest_path = os.path.join(output_folder_name,
                                              f"{i:03d}_{j:03d}.jpg")
                table_annotator.io.write_image(orig_dest_path, cell_image_grid[i][j])

        table_annotator.io.write_table_content(ocr_result_path, table_content)
        print(f"finished table ocr for {image_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract text from table cells')
    parser.add_argument(
        "-f",
        "--force",
        help="Overwrites ocr results even if human annotation already exists.",
        action="store_const",
        dest="force",
        const=True,
        default=False
    )
    parser.add_argument("image_path",
                        help='Path to the image or folder of images you want to '
                             'extract tables for')

    args = parser.parse_args()
    if os.path.isdir(args.image_path):
        if args.force:
            print("Warning: forcing is disabled for processing entire folders. Run it"
                  " in a loop externally if you know what you are doing.")
        image_files = table_annotator.io.list_images(args.image_path)
        for image_file in tqdm.tqdm(image_files):
            table_ocr(os.path.join(args.image_path, image_file))
    else:
        table_ocr(args.image_path, args.force)



