from typing import Text
import os
from flask import Flask, send_from_directory

IMAGE_PATH = "image_path"


def create_app(image_path: Text):
    app = Flask(__name__)
    app.config[IMAGE_PATH] = image_path

    @app.route('/images')
    def list_images():
        files = os.listdir(app.config[IMAGE_PATH])
        allowed_extensions = {".jpeg", ".jpg"}
        relevant_files = [f for f in files
                          if os.path.splitext(f)[1] in allowed_extensions]
        return {"images": relevant_files}

    @app.route('/image/<file_name>')
    def get_image(file_name):
        return send_from_directory(app.config[IMAGE_PATH], file_name)

    return app


if __name__ == '__main__':
    app = create_app("images")

