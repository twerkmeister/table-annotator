from typing import Optional
from flask import Flask, request
from flask.cli import ScriptInfo
from flask_cors import CORS
import numpy as np

from ocr_server.lines import find_lines


def create_app(script_info: Optional[ScriptInfo] = None):
    app = Flask(__name__)
    CORS(app)

    @app.route('/ocr', methods=["POST"])
    def ocr():
        images = [np.array(img, dtype="uint8") for img in request.json["images"]]

        images_text_lines = [find_lines(image) for image in images]
        num_text_lines = [len(text_lines) for text_lines in images_text_lines]
        flattened_line_images = [line for image_lines in images_text_lines
                                for line in image_lines]
        predictions = [str(i)
                       for i in range(len(flattened_line_images))]

        merged_predictions = []
        for i in range(len(num_text_lines)):
            offset = sum(num_text_lines[:i])
            lines_merged = "\n".join(predictions[offset:offset+num_text_lines[i]])
            merged_predictions.append(lines_merged)

        return {"predictions": merged_predictions}

    app.logger.info(f'Starting ocr server')
    return app

