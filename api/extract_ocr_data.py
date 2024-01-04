import argparse
import os
from typing import Text, Optional
import cv2
import table_annotator.io
import table_annotator.cellgrid
import table_annotator.lines


def extract_ocr_data(data_path: Text, target_path: Text,
                     without_corrections: bool = False,
                     without_non_corrections: bool = False,
                     only_extract_type: Optional[Text] = None,
                     window_size: int = 30,
                     padding: int = 0,
                     extract_lines: bool = True) -> None:
    """Extracts ocr data points to a simpler file format."""
    image_paths = [os.path.join(data_path, image_path)
                   for image_path in table_annotator.io.list_images(data_path)]
    tables_for_images = [table_annotator.io.read_tables_for_image(image_path)
                         for image_path in image_paths]
    line_mismatches = 0
    multi_line_images = 0
    examples = 0
    examples_not_for_training = 0
    examples_with_correction = 0
    corrections = []

    os.makedirs(target_path, exist_ok=True)

    for image_path, tables in zip(image_paths, tables_for_images):

        image = table_annotator.io.read_image(image_path)
        image_name = os.path.splitext(os.path.basename(image_path))[0]

        for t_i, t in enumerate(tables):
            # todo: need better mechanism to distinguish which docs are ready
            cell_list, _ = table_annotator.cellgrid.cell_grid_to_list(t.cells)
            needs_ocr = [i for i, c in enumerate(cell_list) if c.ocr_text is None]
            if len(needs_ocr) > 0:
                continue

            cell_image_grid = table_annotator.cellgrid.get_cell_image_grid(image, t, padding)
            for row_i in range(len(t.cells)):
                for col_i in range(len(t.cells[row_i])):
                    # skip those columns that don't have the desired data type
                    if only_extract_type is not None \
                            and only_extract_type not in ";".join(t.columnTypes[col_i]):
                        continue

                    examples += 1
                    cell_text = t.cells[row_i][col_i].extract_text()

                    if "@" in cell_text or cell_text is None:
                        examples_not_for_training += 1
                        continue

                    cell_image = cell_image_grid[row_i][col_i]
                    if extract_lines:
                        text_lines = cell_text.split("\n")
                        if len(text_lines) == 1:
                            line_images = [table_annotator.lines.find_line_single(
                                cell_image,
                                window_size=window_size
                            )]
                        else:
                            multi_line_images += 1
                            line_images = table_annotator.lines.find_lines(cell_image)
                    else:
                        text_lines = [cell_text]
                        line_images = [cell_image]

                    if len(line_images) != len(text_lines):
                        line_mismatches += 1
                        continue

                    ocr_text = t.cells[row_i][col_i].ocr_text
                    human_text = t.cells[row_i][col_i].human_text

                    if human_text is not None and human_text != ocr_text:
                        examples_with_correction += 1
                        corrections.append((ocr_text, human_text))
                        if without_corrections:
                            continue
                    elif without_non_corrections:
                        continue

                    text_lines_predicted = ocr_text.split("\n") if extract_lines else ocr_text
                    for idx, (text, text_predicted, line_image) in \
                            enumerate(
                                zip(text_lines, text_lines_predicted, line_images)
                            ):
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

                        prediction_file = \
                            os.path.join(target_path,
                                         f"{target_identifier}.pred.orig.txt")
                        with open(prediction_file, mode="w", encoding="utf-8") as pf:
                            if text_predicted == "":
                                pf.write("␢")  # empty sign
                            else:
                                pf.write(text_predicted)

    print("Total examples: ", examples)
    print("examples not for training: ", examples_not_for_training)
    print("Multi line images: ", multi_line_images)
    print("Line mismatches: ", line_mismatches)
    print("examples with corrections: ", examples_with_correction)
    # print("\n".join([str(c) for c in corrections]))
    print(f"{examples}, {examples_not_for_training}, {multi_line_images}, "
          f"{line_mismatches}, {examples_with_correction}")


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

    parser.add_argument("-without_corrections", action="store_true", default=False,
                        help="Removes those examples that had corrections.")

    parser.add_argument("-without_non_corrections", action="store_true", default=False,
                        help="Removes those examples that had no corrections")

    parser.add_argument("-only_extract_type", default=None,
                        help="Limit data extraction to certain table data types "
                             "in the table. Checks whether the given type is contained."
                             "Does not need to be an exact match")
    parser.add_argument("-window_size", default=30, type=int,
                        help="set the window size for the line finding heuristic.")
    parser.add_argument("-padding", default=0, type=int,
                        help="Add additional pixels for padding during cropping of cells.")
    parser.add_argument("--extract-lines", default=True, type=bool, action=argparse.BooleanOptionalAction,
                        help="Whether to extract individual lines from cells")

    args = parser.parse_args()
    extract_ocr_data(args.data_path, args.target_path, args.without_corrections,
                     args.without_non_corrections, args.only_extract_type,
                     args.window_size, args.padding, args.extract_lines)
