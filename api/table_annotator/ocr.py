from typing import Text, List
import os
import glob

from table_annotator.types import OCRDataPoint
import table_annotator.io
import table_annotator.img


def collect_ocr_data_points(file_path: Text) -> List[OCRDataPoint]:
    """Traverses a directory with table_ocr outputs and collects the data points."""
    data_points = []
    data_files = glob.glob(f"{file_path}/*/*/ocr_result.json", recursive=True)
    for data_file in data_files:
        table_content = table_annotator.io.read_table_content(data_file)
        _, image_name, table_idx, _ = data_file.split("/")
        for cell_id, cell in table_content.cells.items():
            cell_image_path = os.path.join(file_path, image_name,
                                           table_idx, f"{cell_id}.jpg")
            external_image_path = f"cell_image/{image_name}/{table_idx}/{cell_id}"
            cell_image = table_annotator.io.read_image(cell_image_path)
            image_width, image_height = table_annotator.img.get_dimensions(cell_image)

            data_points.append(
                OCRDataPoint(image_name=image_name, table_idx=table_idx,
                             cell_id=cell_id, ocr_text=cell.ocr_text,
                             human_text=cell.human_text,
                             image_path=external_image_path,
                             image_width=image_width,
                             image_height=image_height)
            )

    return data_points