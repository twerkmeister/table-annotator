from typing import Text, Optional
import os
from flask import Flask, send_from_directory
from flask.cli import ScriptInfo

import img

IMAGE_PATH = "image_path"


def create_app(script_info: Optional[ScriptInfo] = None, image_path: Text = "images"):
    app = Flask(__name__)
    app.config[IMAGE_PATH] = image_path
    app.logger.info(f'Starting server serving images from {image_path}')

    @app.route('/images')
    def list_images():

        files = os.listdir(app.config[IMAGE_PATH])
        allowed_extensions = {".jpeg", ".jpg"}
        relevant_files = [f for f in files
                          if os.path.splitext(f)[1] in allowed_extensions]
        images_with_metadata = []
        for f in relevant_files:
            width, height = img.get_image_dimensions(
                os.path.join(app.config[IMAGE_PATH], f))
            images_with_metadata.append({"src": f"image/{f}", "width": width,
                                         "height": height})
        return {"images": images_with_metadata}

    @app.route('/image/<file_name>')
    def get_image(file_name):
        return send_from_directory(app.config[IMAGE_PATH], file_name)

    return app

