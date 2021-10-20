from typing import Text, Optional
import os
from flask import Flask, send_from_directory, make_response, request
from flask.cli import ScriptInfo

import table_annotator.img
import table_annotator.io

IMAGE_PATH = "image_path"


def create_app(script_info: Optional[ScriptInfo] = None, image_dir: Text = "images"):
    app = Flask(__name__)
    app.config[IMAGE_PATH] = image_dir
    app.logger.info(f'Starting server serving images from directory {image_dir}')

    @app.route('/images')
    def list_images():
        relevant_files = table_annotator.io.list_images(app.config[IMAGE_PATH])
        images_with_metadata = []
        for f in relevant_files:
            image = table_annotator.io.read_image(
                os.path.join(app.config[IMAGE_PATH], f))
            width, height = table_annotator.img.get_dimensions(image)
            center = {"x": width//2, "y": height // 2}
            images_with_metadata.append({"src": f"image/{f}", "width": width,
                                         "height": height, "center": center,
                                         "name": f})
        return {"images": images_with_metadata}

    @app.route('/image/<name>')
    def get_image(name):
        return send_from_directory(app.config[IMAGE_PATH], name)

    @app.route('/tables/<image_name>', methods=["POST"])
    def store_tables(image_name):
        """Stores the tables and returns guesses for next rows."""
        image_path = os.path.join(app.config[IMAGE_PATH], image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to save "
                                         "table data does not exist."}, 404)

        json_path = os.path.splitext(image_path)[0] + ".json"
        table_annotator.io.write_json(json_path, request.json)

        return {"msg": "okay!"}

    @app.route('/tables/<image_name>', methods=["GET"])
    def get_tables(image_name):
        image_path = os.path.join(app.config[IMAGE_PATH], image_name)
        if not os.path.isfile(image_path):
            return make_response({"msg": "The image for which you tried to retrieve "
                                         "table data does not exist."}, 404)

        tables = table_annotator.io.read_tables_for_image(image_path)

        return {"tables": [t.dict() for t in tables]}

    @app.route('/tables/<image_name>/next_rows', methods=["GET"])
    def get_prediction_for_next_row(image_name):
        image_path = os.path.join(app.config[IMAGE_PATH], image_name)
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

    return app

