from typing import Text
import glob
import argparse
import table_annotator.io
from table_annotator.types import DOCUMENT_STATE_DONE


def generate_state_for_docs_with_tables(data_root: Text):
    images = glob.glob(f"{data_root}/**/*.jpg", recursive=True)
    for image in images:
        tables = table_annotator.io.read_tables_for_image(image)
        if len(tables) > 0:
            table_annotator.io.write_state_for_image(image, DOCUMENT_STATE_DONE)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Creates finished document state for "
                                                 "all images with table annotations.")
    parser.add_argument("data_path",
                        help='Path to the folder for which you want to create states.')

    args = parser.parse_args()
    generate_state_for_docs_with_tables(args.data_path)
