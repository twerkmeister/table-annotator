from typing import List
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
