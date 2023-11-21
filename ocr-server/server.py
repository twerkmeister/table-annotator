from typing import Optional
import logging
import multiprocessing as mp
import PIL.Image
import numpy as np
from flask import Flask, request
from flask.cli import ScriptInfo
from flask_cors import CORS

from ocr.model import load_model
from ocr.predict import predict_images
from ocr.config import OCRConfig

from ocr_server.lines import find_line, find_lines

logger = logging.getLogger(__name__)


def create_app(script_info: Optional[ScriptInfo] = None):
    app = Flask(__name__)
    CORS(app)

    ocr_model = load_model('models/latest.hdf5')
    lm_path = 'models/kenlm.binary'
    mp.set_start_method("spawn")

    @app.route('/ocr', methods=["POST"])
    def ocr():
        images = [np.array(img, dtype="uint8") for img in request.json["images"]]

        images_text_lines = [find_lines(image) if image.shape[0] > 40
                             else [find_line(image)]
                             for image in images]
        num_text_lines = [len(text_lines) for text_lines in images_text_lines]
        flattened_line_images = [line for image_lines in images_text_lines
                                 for line in image_lines]
        flattened_line_images = [PIL.Image.fromarray(img)
                                 for img in flattened_line_images]
        config = OCRConfig()
        config.preprocessing.half_width = True
        config.training.batch_size = 8
        config.prediction.num_beams = 32
        predictions = predict_images(config, flattened_line_images, ocr_model, lm_path)

        merged_predictions = []
        for i in range(len(num_text_lines)):
            offset = sum(num_text_lines[:i])
            lines_merged = "\n".join(predictions[offset:offset + num_text_lines[i]])
            merged_predictions.append(lines_merged)

        return {"predictions": merged_predictions}

    app.logger.info(f'Starting ocr server')
    return app
