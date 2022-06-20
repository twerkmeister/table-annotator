from functools import partial
from typing import Text, Optional, Dict, Tuple
import os
from flask import Flask, Blueprint, send_from_directory, \
    make_response, request, send_file
from flask.cli import ScriptInfo
from flask_cors import CORS
import cv2
import io
import PIL.Image
import numpy as np
import requests

import table_annotator.img
import table_annotator.io
import table_annotator.ocr
import table_annotator.cellgrid
from table_annotator.types import CellGrid, Table

DATA_PATH = "data_path"


def create_app(script_info: Optional[ScriptInfo] = None, data_path: Text = "data"):
    app = Flask(__name__)
    api = Blueprint("api", __name__, url_prefix="/api")
    CORS(app)
    app.config[DATA_PATH] = data_path
    app.logger.info(f'Starting server serving documents from directory {data_path}')

    cell_image_cache: Dict[Tuple[Text, int], CellGrid[PIL.Image]] = {}

    def get_workdir(subdir: Text) -> Text:
        return os.path.join(app.config[DATA_PATH], subdir)

    @api.route('/<subdir>/images')
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
            center = {"x": width // 2, "y": height // 2}
            images_with_metadata.append(
                {"src": f"{subdir}/image/{image_name}", "width": width,
                 "height": height, "center": center,
                 "name": image_name, "docId": os.path.splitext(image_name)[0]})
        return {"images": images_with_metadata}

    @api.route('/<subdir>/image/<image_name>')
    def get_image(subdir: Text, image_name: Text):
        workdir = get_workdir(subdir)
        return send_from_directory(workdir, image_name)

    @api.route('/<subdir>/tables/<image_name>', methods=["POST"])
    def store_tables(subdir: Text, image_name: Text):
        """Stores the tables."""
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to save "
                                         "table data does not exist."}, 404)

        table_annotator.io.write_tables_for_image(image_path,
                                                  [Table(**t) for t in request.json])

        return {"msg": "okay!"}

    @api.route('/<subdir>/tables/<image_name>', methods=["GET"])
    def get_tables(subdir: Text, image_name: Text):
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to retrieve "
                                         "table data does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)
        tables_json = {
            "tables": [table_annotator.io.tableToJson(t) for t in tables]
        }

        return tables_json

    @api.route('/<subdir>/<image_name>/predict_table_structure/<int:table_id>',
               methods=["GET"])
    def predict_table_structure(subdir: Text, image_name: Text, table_id: int):
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
        r = requests.post('http://localhost:5002/segment',
                          json={"table_image": table_image_bw.tolist()})

        rows = r.json()["rows"]

        return {"rows": rows}

    @api.route('/<subdir>/<image_name>/predict_table_contents/<int:table_id>',
               methods=["GET"])
    def predict_table_contents(subdir: Text, image_name: Text, table_id: int):
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)

        if not os.path.isfile(image_path):
            return make_response({"msg": "The image does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)

        if table_id not in set(range(len(tables))):
            return make_response({"msg": "The table does not exist."}, 404)

        image = table_annotator.io.read_image(image_path)
        table = tables[table_id]

        updated_cells = table_annotator.ocr.table_ocr(image, table)

        return {"cells": table_annotator.cellgrid.apply_to_cells(
            lambda c: {k: v for k, v in c.dict().items() if v is not None},
            updated_cells)}

    @api.route('/<subdir>/<image_name>/cell_image/<int:table_id>/<int:row>/'
               '<int:col>/<int:table_hash>',
               methods=["GET"])
    def get_cell_image(subdir: Text, image_name: Text,
                       table_id: int, row: int, col: int, table_hash: int):
        workdir = get_workdir(subdir)
        image_path = os.path.join(workdir, image_name)
        if (image_path, table_hash) not in cell_image_cache:
            if not os.path.isfile(image_path):
                return make_response({"msg": "The image does not exist."}, 404)

            tables = table_annotator.io.read_tables_for_image(image_path)

            if table_id not in set(range(len(tables))):
                return make_response({"msg": "The table does not exist."}, 404)

            table = tables[table_id]
            app.logger.info("creating cache")
            image = table_annotator.io.read_image(image_path)
            cell_image_grid = table_annotator.cellgrid.get_cell_image_grid(image, table)
            convert_image = partial(cv2.cvtColor, code=cv2.COLOR_BGR2RGB)
            cell_image_grid = table_annotator.cellgrid.apply_to_cells(convert_image,
                                                                      cell_image_grid)

            def to_pil_img(cell_img: np.ndarray):
                return PIL.Image.fromarray(cell_img.astype('uint8'))
            cell_image_grid = table_annotator.cellgrid.apply_to_cells(to_pil_img,
                                                                      cell_image_grid)

            cell_image_cache[(image_path, table_hash)] = cell_image_grid

        img = cell_image_cache[(image_path, table_hash)][row][col]

        file_object = io.BytesIO()
        img.save(file_object, 'JPEG')
        file_object.seek(0)

        return send_file(file_object, mimetype='image/JPEG')

    app.register_blueprint(api)
    return app
