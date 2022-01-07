import argparse
import os
from typing import Text
import cv2
import table_annotator.ocr
import table_annotator.io
import find_lines


def extract_ocr_data(data_path: Text, target_path: Text,
                     use_empty_sign: bool, apply_blur: bool = False) -> None:
    """Extracts ocr data points to a simpler file format."""
    data_points = table_annotator.ocr.collect_ocr_data_points(data_path)
    if len(data_points) == 0:
        print("No datapoints found...")
        return

    line_mismatches = 0
    multi_line_images = 0

    data_points = [dp for dp in data_points if dp.human_text is not None]
    data_points = [dp for dp in data_points if "@" not in dp.human_text]
    # data_points = [dp for dp in data_points if "\n" not in dp.human_text]

    os.makedirs(target_path, exist_ok=True)

    for dp in data_points:

        image = table_annotator.io.read_image(dp.image_path)

        text_lines = dp.human_text.split("\n")
        if len(text_lines) == 1:
            line_images = [find_lines.find_line_single(image)]
        else:
            multi_line_images += 1
            line_images = find_lines.find_lines(image)

        if len(line_images) != len(text_lines):
            line_mismatches += 1
            continue

        for idx, (text, line_image) in enumerate(zip(text_lines, line_images)):
            target_identifier = f"{dp.image_name}_{dp.table_idx}_{dp.cell_id}_{idx:02d}"

            image_file = os.path.join(target_path, f"{target_identifier}.jpg")
            image_adjusted = cv2.cvtColor(line_image, cv2.COLOR_BGR2GRAY)
            if apply_blur:
                image_adjusted = cv2.medianBlur(image_adjusted, 3)
            table_annotator.io.write_image(image_file, image_adjusted)

            groundtruth_file = os.path.join(target_path, f"{target_identifier}.gt.txt")
            with open(groundtruth_file, mode="w", encoding="utf-8") as gtf:
                if use_empty_sign and text == "":
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

    parser.add_argument("-e", "--empty", action="store_true", default=False,
                        dest="use_empty_sign", help="Whether to use the empty sign ␢"
                                                    "for empty ocr files. ")

    parser.add_argument("-b", "--blur", action="store_true", default=False,
                        dest="apply_blur", help="Whether to apply blurring "
                                                "to the image.")

    args = parser.parse_args()
    extract_ocr_data(args.data_path, args.target_path,
                     args.use_empty_sign, args.apply_blur)
