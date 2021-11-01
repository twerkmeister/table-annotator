from typing import Text, Any, List
import json
import os

import cv2
import numpy as np
import PIL
from table_annotator.types import Table, TableContent, OCRDataPoint


def read_json(file_path: Text) -> Any:
    with open(file_path, encoding="utf-8", mode="r") as f:
        return json.load(f)


def write_json(file_path: Text, obj: Any) -> None:
    with open(file_path, "w", encoding="utf-8") as out:
        json.dump(obj, out, ensure_ascii=False, indent=4)


def read_tables(file_path: Text) -> List[Table]:
    """Reads tables from disc."""
    tables_serialized = read_json(file_path)
    return [Table(**t) for t in tables_serialized]


def read_tables_for_image(image_path: Text) -> List[Table]:
    json_file_path = os.path.splitext(image_path)[0] + ".json"
    if not os.path.isfile(json_file_path):
        return []
    else:
        return read_tables(json_file_path)


def read_image(image_path: Text) -> np.ndarray:
    """Reads an image from disc."""
    return cv2.imread(image_path)


def write_image(file_path: Text, image: np.ndarray) -> None:
    """Writes image to disc."""
    cv2.imwrite(file_path, image)


def get_image_dpi(image_path: Text) -> int:
    im = PIL.Image.open(image_path)
    if "dpi" in im.info:
        return im.info['dpi'][0]
    else:
        return 150


def list_images(path: Text) -> List[Text]:
    """Lists all jpg files in a folder."""
    files = os.listdir(path)
    allowed_extensions = {".jpeg", ".jpg"}
    return [f for f in files if os.path.splitext(f)[1] in allowed_extensions]


def read_table_content(file_path: Text) -> TableContent:
    """Reads tables from disc."""
    return TableContent(**read_json(file_path))


def write_table_content(file_path: Text, table_content: TableContent) -> None:
    """Writes table content to disc."""
    write_json(file_path, table_content.dict())


def update_table_content(ocr_base_dir: Text, ocr_data_point: OCRDataPoint):
    """Updates an ocr_result.json with a new data point."""

