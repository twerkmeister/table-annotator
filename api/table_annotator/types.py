from typing import List, Text, Optional, Dict, TypeVar
from pydantic import BaseModel

T = TypeVar('T')
CellGrid = List[List[T]]


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


class CellContent(BaseModel):
    ocr_text: Text
    human_text: Optional[Text]

    @classmethod
    def new_from_ocr_result(cls, ocr_result: Text):
        return cls(ocr_text=ocr_result, human_text=None)


class Table(BaseModel):
    outline: Rectangle
    rotationDegrees: float
    columns: List[int]
    rows: List[int]
    cellGrid: Optional[CellGrid[Rectangle]]
    contents: Optional[CellGrid[CellContent]]
