from typing import Text, Optional
import os
from multiprocessing import Process
from flask import Flask, send_from_directory, make_response, request
from flask.cli import ScriptInfo
from flask_cors import CORS
import cv2
import requests

import table_annotator.img
import table_annotator.io
import table_annotator.ocr
from table_annotator.types import OCRDataPoint
from table_ocr import table_ocr

DATA_PATH = "data_path"


def create_app(script_info: Optional[ScriptInfo] = None, data_path: Text = "data"):
    app = Flask(__name__)
    CORS(app)
    app.config[DATA_PATH] = data_path
    app.logger.info(f'Starting server serving documents from directory {data_path}')

    def get_workdir(subdir: Text) -> Text:
        return os.path.join(app.config[DATA_PATH], subdir)

    @app.route('/<subdir>/images')
    def list_images(subdir: Text):
        workdir = get_workdir(subdir)
        if not os.path.isdir(workdir):
            return {"images": []}
        image_names = table_annotator.io.list_images(workdir)
        images_with_metadata = []
        for image_name in image_names:
            image_path = os.path.join(workdir, image_name)
            image = table_annotator.io.read_image(image_path)
            width, height = table_annotator.img.get_dimensions(image)
            is_finished = table_annotator.io.is_image_locked(image_path)
            center = {"x": width//2, "y": height // 2}
            images_with_metadata.append({"src": f"{subdir}/image/{image_name}", "width": width,
                                         "height": height, "center": center,
                                         "name": image_name, "finished": is_finished})
        return {"images": images_with_metadata}

    @app.route('/<subdir>/image/<image_name>')
    def get_image(subdir: Text, image_name: Text):
        workdir = get_workdir(subdir)
        return send_from_directory(workdir, image_name)

    @app.route('/<subdir>/image/<image_name>/status', methods=["PUT"])
    def set_image_status(subdir: Text, image_name: Text):
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)
        lock_file_path = table_annotator.io.lock_file_for_image(image_path)

        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried set a status "
                                         "does not exist."}, 404)

        finished = request.json["finished"]
        if finished:
            open(lock_file_path, 'w').close()
        else:
            os.remove(lock_file_path)

        return {"msg": "okay!"}

    @app.route('/<subdir>/image/<image_name>/segment', methods=["POST"])
    def segment_image(subdir: Text, image_name: Text):
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)

        if not os.path.isfile(image_path):
            return make_response({"msg": "The image you tried to segment "
                                         "does not exist."}, 404)

        task = Process(target=table_ocr, args=(image_path, False))
        task.start()

        return {"msg": "okay!"}

    @app.route('/<subdir>/tables/<image_name>', methods=["POST"])
    def store_tables(subdir: Text, image_name: Text):
        """Stores the tables and returns guesses for next rows."""
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to save "
                                         "table data does not exist."}, 404)

        json_path = os.path.splitext(image_path)[0] + ".json"
        table_annotator.io.write_json(json_path, request.json)

        return {"msg": "okay!"}

    @app.route('/<subdir>/tables/<image_name>', methods=["GET"])
    def get_tables(subdir: Text, image_name: Text):
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to retrieve "
                                         "table data does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)

        return {"tables": [t.dict() for t in tables]}

    @app.route('/<subdir>/tables/<image_name>/next_rows', methods=["GET"])
    def get_prediction_for_next_row(subdir: Text, image_name: Text):
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to retrieve "
                                         "table data does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)

        if len(tables) == 0:
            return {"next_rows": None}

        guesses = []
        for t in tables:
            guesses.append(
                table_annotator.img.predict_next_row_position(image_path, t))

        return {"next_rows": guesses}

    @app.route('/<subdir>/<image_name>/segment_table/<int:table_id>', methods=["GET"])
    def segment_table(subdir: Text, image_name: Text, table_id: int):
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)

        if table_id not in set(range(len(tables))):
            return make_response({"msg": "The table does not exist."}, 404)

        table = tables[table_id]
        image = table_annotator.io.read_image(image_path)
        table_image = table_annotator.img.extract_table_image(image, table)
        table_image_bw = cv2.cvtColor(table_image, cv2.COLOR_BGR2GRAY)
        r = requests.post('http://segmenting-server:5002/segment',
                          json={"table_image": table_image_bw.tolist()})

        rows = r.json()["rows"]
        print(rows) 

        return {"rows": rows}

    @app.route('/<subdir>/data_points', methods=["GET"])
    def get_ocr_data_points(subdir: Text):
        workdir = get_workdir(subdir)
        data_points = table_annotator.ocr.collect_ocr_data_points(workdir)
        return {"data_points": [dp.dict() for dp in data_points]}

    @app.route('/<subdir>/cell_image/<document_name>/<table_idx>/<cell_id>',
               methods=["GET"])
    def get_cell_image(subdir: Text, document_name: Text,
                       table_idx: Text, cell_id: Text):
        workdir = get_workdir(subdir)
        directory = os.path.join(workdir, document_name, table_idx)
        return send_from_directory(directory, f"{cell_id}.jpg")

    @app.route('/<subdir>/data_points', methods=["POST"])
    def save_ocr_data_point(subdir: Text):
        workdir = get_workdir(subdir)
        ocr_data_point = OCRDataPoint(**request.json)
        ocr_data_path = os.path.join(workdir,
                                     ocr_data_point.image_name,
                                     ocr_data_point.table_idx,
                                     "ocr_result.json")

        if not os.path.isfile(ocr_data_path):
            return make_response({"msg": "Cannot find the ocr results "
                                         "you tried to update"}, 404)

        table_content = table_annotator.io.read_table_content(ocr_data_path)
        table_content.update(ocr_data_point)
        table_annotator.io.write_table_content(ocr_data_path, table_content)

        return {"msg": "okay!"}

    return app

