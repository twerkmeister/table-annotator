import table_annotator.ocr


def test_collect_ocr_data_points():
    data_folder = "test_ocr_data"
    data_points = table_annotator.ocr.collect_ocr_data_points(data_folder)

    assert len(data_points) == 8 * 6 + 9 * 5 + 6 * 5

    