import argparse
import csv
import os
from typing import Text
import table_annotator.io
import table_annotator.cellgrid
import table_annotator.lines

csv.register_dialect('unix+', dialect="unix", doublequote=False, escapechar='\\')


def replace_newlines(text: Text) -> Text:
    return text.replace("\n", " ").replace(" ␢", "").replace("␢", "")


def replace_at_symbol(text: Text) -> Text:
    return text.replace("@", "")


def extract_people_data(data_path: Text, target_path: Text) -> None:
    """Extracts ocr data points to a simpler file format."""
    image_paths = [os.path.join(data_path, image_path)
                   for image_path in table_annotator.io.list_images(data_path)]
    tables_for_images = [table_annotator.io.read_tables_for_image(image_path)
                         for image_path in image_paths]

    os.makedirs(target_path, exist_ok=True)

    for image_path, tables in zip(image_paths, tables_for_images):

        image_name = os.path.splitext(os.path.basename(image_path))[0]

        for t_i, t in enumerate(tables):
            cell_list, _ = table_annotator.cellgrid.cell_grid_to_list(t.cells)
            needs_ocr = [i for i, c in enumerate(cell_list) if c.ocr_text is None]
            if len(needs_ocr) > 0:
                continue

            valid_virtual_values = [v for v in t.virtualValues or []
                                    if v.value and v.label]
            if len(valid_virtual_values) > 0:
                virtual_values, virtual_types = zip(*[(v.value, v.label)
                                                      for v in valid_virtual_values])
            else:
                virtual_values, virtual_types = [], []

            target_csv_path = os.path.join(target_path, f"{image_name}_{t_i}.csv")
            with open(target_csv_path, "w") as out:
                writer = csv.writer(out, dialect="unix+")
                writer.writerow([";".join(types) for types in t.columnTypes]
                                + list(virtual_types))
                text_rows = \
                    table_annotator.cellgrid.apply_to_cells(lambda c: c.extract_text(),
                                                            t.cells)
                text_rows = table_annotator.cellgrid.apply_to_cells(replace_newlines,
                                                                    text_rows)
                text_rows = table_annotator.cellgrid.apply_to_cells(replace_at_symbol,
                                                                    text_rows)
                for text_row in text_rows:
                    writer.writerow(text_row + list(virtual_values))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Extracts the people's data as csv")
    parser.add_argument("data_path",

                        help='Path to the folder which you want to extract. '
                             'Needs to be a workdir of the server, '
                             'i.e. a folder containing images.')

    parser.add_argument("target_path",
                        help='Path to the folder where you want to store the extracted '
                             'data')

    args = parser.parse_args()
    extract_people_data(args.data_path, args.target_path)
