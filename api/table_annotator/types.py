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


class Table(BaseModel):
    outline: Rectangle
    rotationDegrees: float
    columns: List[int]
    rows: List[int]
