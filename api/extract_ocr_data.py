import argparse
import os
import shutil
from typing import Text

import table_annotator.ocr


def extract_ocr_data(data_path: Text, target_path: Text) -> None:
    """Extracts ocr data points to a simpler file format."""
    data_points = table_annotator.ocr.collect_ocr_data_points(data_path)
    if len(data_points) == 0:
        print("No datapoints found...")
        return

    data_points = [dp for dp in data_points if dp.human_text is not None]
    data_points = [dp for dp in data_points if "@" not in dp.human_text]
    data_points = [dp for dp in data_points if "\n" not in dp.human_text]

    os.makedirs(target_path, exist_ok=True)

    for dp in data_points:
        target_identifier = f"{dp.image_name}_{dp.table_idx}_{dp.cell_id}"
        target_image_file = os.path.join(target_path, f"{target_identifier}.jpg")
        shutil.copyfile(dp.image_path, target_image_file)
        groundtruth_file = os.path.join(target_path, f"{target_identifier}.gt.txt")
        with open(groundtruth_file, mode="w", encoding="utf-8") as gtf:
            gtf.write(dp.human_text)


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