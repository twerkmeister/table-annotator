from typing import List, Text, Optional, TypeVar
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


class Cell(BaseModel):
    top: Optional[int]
    right: Optional[int]
    bottom: Optional[int]
    left: Optional[int]
    ocr_text: Optional[Text]
    human_text: Optional[Text]

    def extract_text(self) -> Optional[Text]:
        return self.human_text if self.human_text is not None \
            else self.ocr_text


class Table(BaseModel):
    outline: Rectangle
    rotationDegrees: float
    columns: List[int]
    rows: List[int]
    cells: CellGrid[Cell]
    structureLocked: bool
    columnTypes: Optional[List[List[Text]]]

    def __hash__(self) -> int:
        cells = tuple([cell for row in self.cells for cell in row])
        return hash((self.outline, self.rotationDegrees,
                     tuple(self.rows), tuple(self.columns),
                     tuple(cells)))
