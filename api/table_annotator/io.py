import functools
from collections import defaultdict
from typing import Text, Any, List, Dict, Optional
import json
import csv
import os
from filelock import FileLock

import cv2
import numpy as np
from table_annotator.types import Table, DocumentState, DOCUMENT_STATE_TODO
import table_annotator.cellgrid


def read_json(file_path: Text) -> Any:
    with FileLock(f"{file_path}.lock"):
        with open(file_path, encoding="utf-8", mode="r") as f:
            return json.load(f)


def write_json(file_path: Text, obj: Any) -> None:
    with FileLock(f"{file_path}.lock"):
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
    write_json(json_file_path, [table_as_json(t) for t in tables])


def read_state_for_image(image_path: Text) -> DocumentState:
    state_file_path = os.path.splitext(image_path)[0] + ".state.json"
    if not os.path.isfile(state_file_path):
        return DocumentState(state=DOCUMENT_STATE_TODO)
    else:
        state_serialized = read_json(state_file_path)
        return DocumentState(**state_serialized)


def write_state_for_image(image_path: Text, state: Text) -> None:
    state_file_path = os.path.splitext(image_path)[0] + ".state.json"
    write_json(state_file_path, {"state": state})


def read_image(image_path: Text) -> np.ndarray:
    """Reads an image from disc."""
    with FileLock(f"{image_path}.lock"):
        return cv2.imread(image_path)


def write_image(file_path: Text, image: np.ndarray) -> None:
    """Writes image to disc."""
    with FileLock(f"{file_path}.lock"):
        cv2.imwrite(file_path, image)


def list_images(path: Text) -> List[Text]:
    """Lists all jpg files in a folder."""
    files = os.listdir(path)
    allowed_extensions = {".jpeg", ".jpg"}
    return sorted([f for f in files if os.path.splitext(f)[1] in allowed_extensions])


def get_previous_image(image_path: Text) -> Optional[Text]:
    """Finds the previous image in the folder if it exists."""
    folder = os.path.dirname(image_path)
    images = list_images(folder)
    index_of_image = images.index(os.path.basename(image_path))
    if index_of_image == -1 or index_of_image == 0:
        return None
    else:
        return os.path.join(folder, images[index_of_image - 1])


def table_as_json(table: Table) -> Dict[Text, Any]:
    table_json = {
        k: v for k, v in table.dict().items()
        if v is not None
    }
    table_json["cells"] = table_annotator.cellgrid.apply_to_cells(
        lambda c: {k: v for k, v in c.items() if v is not None}, table_json["cells"]
    )
    return table_json


def get_all_non_hidden_dirs(path: str, return_base_names: bool = False) -> list[str]:
    dirs = [os.path.join(path, project_name)
                     for project_name in os.listdir(path)]
    dirs = [d for d in dirs if os.path.isdir(d) and not d.startswith('.')]
    if return_base_names:
        return [os.path.basename(d) for d in dirs]
    else:
        return dirs
