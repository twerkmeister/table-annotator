from typing import Text
import pytest

import img


@pytest.mark.parametrize("img_path, width, height",
                         [("test_images/ducks_1.jpeg", 620, 465),
                          ("test_images/ducks_2.jpg", 640, 427)])
def test_get_image_dimensions(img_path: Text, width: int, height: int) -> None:
    assert (width, height) == img.get_image_dimensions(img_path)
