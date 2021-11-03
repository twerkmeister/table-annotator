import table_annotator.io


def test_read_tables() -> None:
    table_json_path = "test_data/01/0100_5312606_1.json"
    tables = table_annotator.io.read_tables(table_json_path)
    assert len(tables) == 1
    assert len(tables[0].columns) == 2

