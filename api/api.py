from collections import Counter
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
import table_annotator.column_types
import table_annotator.pre_annotated
from table_annotator import matching
from table_annotator.types import CellGrid, Table, DOCUMENT_STATE_TODO

DATA_PATH = "data_path"


def create_app(script_info: Optional[ScriptInfo] = None, data_path: Text = "data"):
    app = Flask(__name__)
    api = Blueprint("api", __name__, url_prefix="/api")
    CORS(app)
    app.config[DATA_PATH] = data_path
    app.logger.info(f'Starting server serving documents from directory {data_path}')

    cell_image_cache: Dict[Tuple[Text, int], CellGrid[PIL.Image]] = {}

    def get_workdir(bucket: Text, project: Text, subdir: Text) -> Text:
        return os.path.join(app.config[DATA_PATH], bucket, project, subdir)

    @api.route("/")
    def get_all_status_folders():
        data_path = app.config[DATA_PATH]
        project_buckets = table_annotator.io.get_all_non_hidden_dirs(data_path,
                                                                return_base_names=True)
        return {"bucketNames": sorted(project_buckets)}

    @api.route('/<bucket>/')
    def get_all_projects(bucket: str):
        bucket_dir = os.path.join(app.config[DATA_PATH], bucket)
        if not os.path.isdir(bucket_dir):
            return make_response({"msg": "The state dir does not exist."}, 404)
        project_names = table_annotator.io.get_all_non_hidden_dirs(bucket_dir,
                                                                   return_base_names=True)
        return {"projectNames": sorted(project_names)}

    @api.route('/<bucket>/<project>')
    def get_project(bucket: str, project: str):
        project_path = os.path.join(app.config[DATA_PATH], bucket, project)
        if not os.path.isdir(project_path):
            return make_response({"msg": "The project does not exist."}, 404)
        work_dirs = table_annotator.io.get_all_non_hidden_dirs(project_path)
        work_dir_infos = []

        for work_dir in work_dirs:
            images = [os.path.join(work_dir, image)
                      for image in table_annotator.io.list_images(work_dir)]
            states = [table_annotator.io.read_state_for_image(image).state
                      for image in images]
            states_counter = Counter(states)
            try:
                first_todo_doc_index = states.index(DOCUMENT_STATE_TODO)
                first_todo_doc = os.path.splitext(images[first_todo_doc_index])[0]
                first_todo_doc = os.path.split(first_todo_doc)[-1]
            except ValueError:
                first_todo_doc = None

            num_processed_docs = \
                len(states_counter) - states_counter[DOCUMENT_STATE_TODO]

            work_dir_infos.append({
                "name": os.path.basename(work_dir),
                "numDocuments": len(images),
                "numDocumentsDone": num_processed_docs,
                "numDocumentsTodo": states_counter[DOCUMENT_STATE_TODO],
                "firstTodoDoc": first_todo_doc
            })
        work_dir_infos = sorted(work_dir_infos, key=lambda wdi: wdi["name"])
        return {"project": {
            "name": project,
            "workPackages": work_dir_infos
        }}

    @api.route('/<bucket>/<project>/<subdir>/images')
    def list_images(bucket: Text, project: Text, subdir: Text):
        workdir = get_workdir(bucket, project, subdir)
        if not os.path.isdir(workdir):
            return make_response(
                {"msg": "The workdir you tried to access does not exist."}, 404)
        image_names = table_annotator.io.list_images(workdir)
        images_with_metadata = []
        for image_name in image_names:
            image_path = os.path.join(workdir, image_name)
            image = table_annotator.io.read_image(image_path)
            width, height = table_annotator.img.get_dimensions(image)
            has_pre_annotated_data = \
                table_annotator.pre_annotated.image_has_pre_annotated_data(image_path)
            has_matching_data = os.path.exists(
                os.path.join(app.config[DATA_PATH], project, "persdata.csv")
            )
            center = {"x": width // 2, "y": height // 2}
            images_with_metadata.append(
                {"src": f"{bucket}/{project}/{subdir}/image/{image_name}", "width": width,
                 "height": height, "center": center,
                 "name": image_name, "docId": os.path.splitext(image_name)[0],
                 "hasPreAnnotatedData": has_pre_annotated_data,
                 "hasMatchingData": has_matching_data
                 })
        return {"images": images_with_metadata}

    @api.route('/<bucket>/<project>/<subdir>/image/invert/<image_name>', methods=["POST"])
    def invert_image(bucket: Text, project: Text, subdir: Text, image_name: Text):
        workdir = get_workdir(bucket, project, subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image you tried to invert"
                                         "does not exist."}, 404)
        image = table_annotator.io.read_image(image_path)
        image = np.invert(image)
        table_annotator.io.write_image(image_path, image)
        return make_response({"msg": "Ok"}, 200)

    @api.route('/<bucket>/<project>/<subdir>/image/rotate/<image_name>', methods=["POST"])
    def rotate_image(bucket: Text, project: Text, subdir: Text, image_name: Text):
        workdir = get_workdir(bucket, project, subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image you tried to invert"
                                         "does not exist."}, 404)
        image = table_annotator.io.read_image(image_path)
        image = np.rot90(image, 3)
        table_annotator.io.write_image(image_path, image)
        return make_response({"msg": "Ok"}, 200)

    @api.route('/<bucket>/<project>/<subdir>/image/<image_name>')
    def get_image(bucket: Text, project: Text, subdir: Text, image_name: Text):
        workdir = get_workdir(bucket, project, subdir)
        return send_from_directory(workdir, image_name)

    @api.route('/<project>/<subdir>/state/<image_name>', methods=["GET"])
    def get_document_state(project: Text, subdir: Text, image_name: Text):
        workdir = get_workdir(project, subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to retrieve "
                                         "state data does not exist."}, 404)

        state = table_annotator.io.read_state_for_image(image_path)
        return state.dict()

    @api.route('/<bucket>/<project>/<subdir>/state/<image_name>', methods=["POST"])
    def set_document_state(bucket: Text, project: Text, subdir: Text, image_name: Text):
        workdir = get_workdir(bucket, project, subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to save "
                                         "state data does not exist."}, 404)

        table_annotator.io.write_state_for_image(image_path,
                                                 request.json["state"])

        return {"msg": "OK"}

    @api.route('/<bucket>/<project>/<subdir>/tables/<image_name>', methods=["POST"])
    def store_tables(bucket: Text, project: Text, subdir: Text, image_name: Text):
        """Stores the tables."""
        workdir = get_workdir(bucket, project, subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to save "
                                         "table data does not exist."}, 404)

        table_annotator.io.write_tables_for_image(image_path,
                                                  [Table(**t) for t in request.json])

        return {"msg": "OK"}

    @api.route('/<bucket>/<project>/<subdir>/tables/<image_name>', methods=["GET"])
    def get_tables(bucket, project: Text, subdir: Text, image_name: Text):
        workdir = get_workdir(bucket, project, subdir)
        image_path = os.path.join(workdir, image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to retrieve "
                                         "table data does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)
        tables_json = {
            "tables": [table_annotator.io.table_as_json(t) for t in tables]
        }

        return tables_json

    @api.route(
        '/<bucket>/<project>/<subdir>/<image_name>/predict_table_structure/<int:table_id>',
        methods=["GET"])
    def predict_table_structure(bucket: Text, project: Text, subdir: Text, image_name: Text,
                                table_id: int):
        workdir = get_workdir(bucket, project, subdir)
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

    @api.route('/<bucket>/<project>/<subdir>/<image_name>/predict_table_contents/<int:table_id>',
               methods=["GET"])
    def predict_table_contents(bucket: Text, project: Text, subdir: Text,
                               image_name: Text, table_id: int):
        workdir = get_workdir(bucket, project, subdir)
        image_path = os.path.join(workdir, image_name)

        if not os.path.isfile(image_path):
            return make_response({"msg": "The image does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)

        if table_id not in set(range(len(tables))):
            return make_response({"msg": "The table does not exist."}, 404)

        image = table_annotator.io.read_image(image_path)
        table = tables[table_id]

        # Try to guess column types if tabel has not been OCR-ed before
        cell_list = table_annotator.cellgrid.cell_grid_to_list(table.cells)[0]
        if any([cell.ocr_text is not None for cell in cell_list]):
            column_types = table.columnTypes
        else:
            column_types = \
                table_annotator.column_types.guess_column_types(image_path,
                                                                tables, table_id)

        updated_cells = table_annotator.ocr.table_ocr(image, table)

        return {"cells": table_annotator.cellgrid.apply_to_cells(
            lambda c: {k: v for k, v in c.dict().items() if v is not None},
            updated_cells),
            "columnTypes": column_types}

    @api.route('/<bucket>/<project>/<subdir>/<image_name>/match_table_contents/<int:table_id>',
               methods=["GET"])
    def match_table_contents(bucket: Text, project: Text, subdir: Text,
                               image_name: Text, table_id: int):
        workdir = get_workdir(bucket, project, subdir)
        image_path = os.path.join(workdir, image_name)

        if not os.path.isfile(image_path):
            return make_response({"msg": "The image does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)

        if table_id not in set(range(len(tables))):
            return make_response({"msg": "The table does not exist."}, 404)

        pers_data_path = os.path.join(app.config[DATA_PATH], project,
                                          "persdata.csv")
        if not os.path.isfile(pers_data_path):
            return make_response({"msg": "No persdata for project."}, 404)

        pers_data_index = matching.read_persdata_index(pers_data_path)
        table = tables[table_id]
        matches = matching.match_table(table, pers_data_index)
        if matches:
            return {"matches": [m.dict() if m is not None else None for m in matches]}
        else:
            return {"matches": None}


    @api.route(
        '/<bucket>/<project>/<subdir>/<image_name>/apply_pre_annotated_table_content/<int:table_id>',
        methods=["GET"])
    def apply_pre_annotated_table_content(bucket: Text, project: Text, subdir: Text,
                                          image_name: Text, table_id: int):
        workdir = get_workdir(bucket, project, subdir)
        image_path = os.path.join(workdir, image_name)

        if not os.path.isfile(image_path):
            return make_response({"msg": "The image does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)

        if table_id not in set(range(len(tables))):
            return make_response({"msg": "The table does not exist."}, 404)

        table = tables[table_id]
        previous_tables = tables[:table_id]
        offset = 0
        for t in previous_tables:
            offset += len(t.cells) if t.cells else 0
        updated_cells = \
            table_annotator.pre_annotated.apply_pre_annotated_csv(image_path,
                                                                  table, offset)

        return {"cells": table_annotator.cellgrid.apply_to_cells(
            lambda c: {k: v for k, v in c.dict().items() if v is not None},
            updated_cells)}

    @api.route('/<bucket>/<project>/<subdir>/<image_name>/cell_image/<int:table_id>/<int:row>/'
               '<int:col>/<int:table_hash>',
               methods=["GET"])
    def get_cell_image(bucket: Text, project: Text, subdir: Text, image_name: Text,
                       table_id: int, row: int, col: int, table_hash: int):
        workdir = get_workdir(bucket, project, subdir)
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
