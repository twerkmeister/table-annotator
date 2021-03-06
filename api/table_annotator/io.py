from typing import Text, Any, List, Dict
import json
import os

import cv2
import numpy as np
import PIL
from table_annotator.types import Table
import table_annotator.cellgrid


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


def write_tables_for_image(image_path: Text, tables: List[Table]) -> None:
    json_file_path = os.path.splitext(image_path)[0] + ".json"
    write_json(json_file_path, [tableToJson(t) for t in tables])


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
    return sorted([f for f in files if os.path.splitext(f)[1] in allowed_extensions])


def tableToJson(table: Table) -> Dict[Text, Any]:
    table_json = {
        k: v for k, v in table.dict().items()
        if v is not None
    }
    table_json["cells"] = table_annotator.cellgrid.apply_to_cells(
        lambda c: {k: v for k, v in c.items() if v is not None}, table_json["cells"]
    )
    return table_json