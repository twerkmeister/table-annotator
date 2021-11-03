import table_annotator.ocr


def test_collect_ocr_data_points():
    data_folder = "test_data/01"
    data_points = table_annotator.ocr.collect_ocr_data_points(data_folder)

    assert len(data_points) == 16 * 3

