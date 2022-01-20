import argparse
import os
from typing import Text
import cv2
import table_annotator.io
import table_annotator.cellgrid
import find_lines
from table_annotator.types import CellContent


def extract_ocr_data(data_path: Text, target_path: Text) -> None:
    """Extracts ocr data points to a simpler file format."""
    image_paths = [os.path.join(data_path, image_path)
                   for image_path in table_annotator.io.list_images(data_path)]
    tables_for_images = [table_annotator.io.read_tables_for_image(image_path)
                         for image_path in image_paths]

    line_mismatches = 0
    multi_line_images = 0

    os.makedirs(target_path, exist_ok=True)

    for image_path, tables in zip(image_paths, tables_for_images):
        if len(tables) == 0 or all([t.cellContents is None for t in tables]):
            continue

        image = table_annotator.io.read_image(image_path)
        image_name = os.path.splitext(os.path.basename(image_path))[0]

        for t_i, t in enumerate(tables):
            if t.cellContents is None:
                continue
            cell_image_grid = table_annotator.cellgrid.get_cell_image_grid(image, t)
            for row_i in range(len(t.cellContents)):
                for col_i in range(len(t.cellContents[row_i])):
                    cell_text = CellContent.extract_text(t.cellContents[row_i][col_i])
                    if "@" in cell_text:
                        continue
                    cell_image = cell_image_grid[row_i][col_i]
                    text_lines = cell_text.split("\n")
                    if len(text_lines) == 1:
                        line_images = [find_lines.find_line_single(cell_image)]
                    else:
                        multi_line_images += 1
                        line_images = find_lines.find_lines(cell_image)

                    if len(line_images) != len(text_lines):
                        line_mismatches += 1
                        continue

                    for idx, (text, line_image) in enumerate(zip(text_lines,
                                                                 line_images)):
                        target_identifier = f"{image_name}_{t_i}_{row_i}_" \
                                            f"{col_i}_{idx:02d}"

                        image_file = os.path.join(target_path,
                                                  f"{target_identifier}.jpg")
                        image_bw = cv2.cvtColor(line_image, cv2.COLOR_BGR2GRAY)
                        table_annotator.io.write_image(image_file, image_bw)

                        groundtruth_file = os.path.join(target_path,
                                                        f"{target_identifier}.gt.txt")
                        with open(groundtruth_file, mode="w", encoding="utf-8") as gtf:
                            if text == "":
                                gtf.write("␢")  # empty sign
                            else:
                                gtf.write(text)

    print("Multi line images:", multi_line_images)
    print("Line mismatches:", line_mismatches)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extracts OCR Data points for easier '
                                                 'downstream processing')
    parser.add_argument("data_path",
                        help='Path to the folder for which you want to extract '
                             'ocr data points. Needs to be a workdir of the server,'
                             'i.e. a folder containing images.')

    parser.add_argument("target_path",
                        help='Path to the folder where you want to store the extracted '
                             'data')

    args = parser.parse_args()
    extract_ocr_data(args.data_path, args.target_path)
