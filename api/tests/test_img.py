from typing import Text
import pytest
import numpy as np

from table_annotator import img
from table_annotator.types import Point, Rectangle


@pytest.mark.parametrize("img_path, width, height",
                         [("test_images/ducks_1.jpeg", 620, 465),
                          ("test_images/ducks_2.jpg", 640, 427)])
def test_get_image_dimensions(img_path: Text, width: int, height: int) -> None:
    assert (width, height) == img.get_image_dimensions(img_path)


def test_get_image_rectangle() -> None:
    img_path = "test_images/bluegreen.png"
    image = img.read(img_path)

    blue_part = img.get_image_rectangle(image,
                                        Rectangle(topLeft=Point(x=0, y=0),
                                                  bottomRight=Point(x=100, y=100)))
    green_part = img.get_image_rectangle(image,
                                         Rectangle(topLeft=Point(x=100, y=0),
                                                   bottomRight=Point(x=200, y=100)))
    assert blue_part.shape == (100, 100, 3)
    assert green_part.shape == (100, 100, 3)
    assert np.all(blue_part == [255, 0, 0])
    assert np.all(green_part == [0, 255, 0])


def test_get_image_rectangle_borders() -> None:
    img_path = "test_images/bluegreen.png"
    image = img.read(img_path)

    oversized_part = img.get_image_rectangle(image,
                                             Rectangle(topLeft=Point(x=-10, y=-10),
                                                       bottomRight=Point(x=210, y=110)))
    assert oversized_part.shape == (100, 200, 3)
