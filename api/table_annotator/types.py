from typing import List, Text, Optional, Dict
from pydantic import BaseModel


class Point(BaseModel):
    x: int
    y: int


class Rectangle(BaseModel):
    topLeft: Point
    bottomRight: Point

    def width(self):
        return self.bottomRight.x - self.topLeft.x

    def height(self):
        return self.bottomRight.y - self.topLeft.y

    def translate(self, p: Point):
        new_top_left = Point(x=self.topLeft.x + p.x, y=self.topLeft.y + p.y)
        new_bottom_right = Point(x=self.bottomRight.x + p.x, y=self.bottomRight.y + p.y)
        return Rectangle(topLeft=new_top_left, bottomRight=new_bottom_right)

    def __hash__(self) -> int:
        return hash((self.topLeft.x, self.topLeft.y,
                     self.bottomRight.x, self.bottomRight.y))


class Table(BaseModel):
    outline: Rectangle
    rotationDegrees: float
    columns: List[int]
    rows: List[int]


class CellContent(BaseModel):
    ocr_text: Text
    human_text: Optional[Text]

    @classmethod
    def new_from_ocr_result(cls, ocr_result: Text):
        return cls(ocr_text=ocr_result, human_text=None)


class TableContent(BaseModel):
    cells: Dict[Text, CellContent]

    @classmethod
    def from_cells(cls, cells: List[List[CellContent]]):
        cells_dict = {}
        for i in range(len(cells)):
            for j in range(len(cells[i])):
                cells_dict[f"{i:03d}_{j:03d}"] = cells[i][j]
        return cls(cells=cells_dict)


class OCRDataPoint(BaseModel):
    image_name: Text
    table_idx: Text
    cell_id: Text
    ocr_text: Text
    human_text: Optional[Text]
    image_path: Text
    image_width: int
    image_height: int
