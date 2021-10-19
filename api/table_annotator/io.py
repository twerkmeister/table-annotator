from typing import Text, Any, List
import json
import functools
import os

import cv2
import numpy as np

from table_annotator.types import Table


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


@functools.lru_cache(1000)
def read_image(image_path: Text) -> np.ndarray:
    """Reads an image from disc."""
    return cv2.imread(image_path)


def write_image(file_path: Text, image: np.ndarray) -> None:
    """Writes image to disc."""
    cv2.imwrite(file_path, image)