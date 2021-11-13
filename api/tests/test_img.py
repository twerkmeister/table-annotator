from typing import Text
import pytest
import numpy as np

import table_annotator.img
import table_annotator.io
from table_annotator.types import Point, Rectangle


@pytest.mark.parametrize("img_path, width, height",
                         [("test_data/01/0100_5312606_1.jpg", 1264, 880)])
def test_get_dimensions(img_path: Text, width: int, height: int) -> None:
    image = table_annotator.io.read_image(img_path)
    assert (width, height) == table_annotator.img.get_dimensions(image)


def test_crop() -> None:
    img_path = "test_data/01/bluegreen.png"
    image = table_annotator.io.read_image(img_path)

    blue_part = table_annotator.img.crop(image,
                                         Rectangle(topLeft=Point(x=0, y=0),
                                                   bottomRight=Point(x=100, y=100)))
    green_part = table_annotator.img.crop(image,
                                          Rectangle(topLeft=Point(x=100, y=0),
                                                    bottomRight=Point(x=200, y=100)))
    assert blue_part.shape == (100, 100, 3)
    assert green_part.shape == (100, 100, 3)
    assert np.all(blue_part == [255, 0, 0])
    assert np.all(green_part == [0, 255, 0])


def test_get_image_rectangle_borders() -> None:
    img_path = "test_data/01/bluegreen.png"
    image = table_annotator.io.read_image(img_path)

    oversized_part = table_annotator.img.crop(image,
                                              Rectangle(topLeft=Point(x=-10, y=-10),
                                                        bottomRight=Point(x=210, y=110)))
    assert oversized_part.shape == (100, 200, 3)


def test_extract_table() -> None:
    img_path = "test_data/01/0100_5312606_1.jpg"
    table_json_path = "test_data/01/0100_5312606_1.json"

    image = table_annotator.io.read_image(img_path)
    table = table_annotator.io.read_tables(table_json_path)[0]

    table_image_part = table_annotator.img.extract_table_image(image, table)

    assert table_image_part.shape == (table.outline.height(), table.outline.width(), 3)

    # table_annotator.io.write_image("cell_test/table.jpg", table_image_part)


def test_get_cell_grid() -> None:
    table_json_path = "test_data/01/0100_5312606_1.json"
    table = table_annotator.io.read_tables(table_json_path)[0]

    expected_rows = len(table.rows) + 1
    expected_columns = len(table.columns) + 1
    cell_grid = table_annotator.img.get_cell_grid(table)
    assert len(cell_grid) == expected_rows
    # all cells in first row start at y = 0px
    for cell in cell_grid[0]:
        assert cell.topLeft.y == 0
    # all cells in last row start at y = "height"px
    for cell in cell_grid[-1]:
        assert cell.bottomRight.y == table.outline.height()

    for row in cell_grid:
        assert len(row) == expected_columns
        # first cell in row starts at x = 0px
        assert row[0].topLeft.x == 0
        # last cell row in row ends at x = "width"px
        assert row[-1].bottomRight.x == table.outline.width()


def test_get_cell_image_grid() -> None:
    img_path = "test_data/01/0100_5312606_1.jpg"
    table_json_path = "test_data/01/0100_5312606_1.json"

    image = table_annotator.io.read_image(img_path)
    table = table_annotator.io.read_tables(table_json_path)[0]
    table_image = table_annotator.img.extract_table_image(image, table)

    cell_image_grid = table_annotator.img.get_cell_image_grid(image, table)

    # concatenating the images should result in the original image

    assert np.all(table_image == table_annotator.img.join_grid(cell_image_grid))


def test_take_rows() -> None:
    table_json_path = "test_data/01/0100_5312606_1.json"

    table = table_annotator.io.read_tables(table_json_path)[0]
    cell_grid = table_annotator.img.get_cell_grid(table)

    assert len(cell_grid) == len(table.rows) + 1
    reduced_cell_grid = table_annotator.img.take_rows(cell_grid, [0, 3])

    assert len(reduced_cell_grid) == 2

    assert cell_grid[0] == reduced_cell_grid[0]
    assert cell_grid[3] == reduced_cell_grid[1]


def test_take_columns() -> None:
    table_json_path = "test_data/01/0100_5312606_1.json"

    table = table_annotator.io.read_tables(table_json_path)[0]
    cell_grid = table_annotator.img.get_cell_grid(table)

    assert all([len(row) == len(table.columns) + 1 for row in cell_grid])
    reduced_cell_grid = table_annotator.img.take_columns(cell_grid, [0, 2])

    assert all([len(row) == 2 for row in reduced_cell_grid])

    assert cell_grid[0] != reduced_cell_grid[0]

    assert all([cell_grid[row_i][0] == reduced_cell_grid[row_i][0]
                for row_i in range(len(cell_grid))])

    assert all([cell_grid[row_i][2] == reduced_cell_grid[row_i][1]
                for row_i in range(len(cell_grid))])
