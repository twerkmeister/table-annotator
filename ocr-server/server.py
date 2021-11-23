from typing import Optional
from flask import Flask, request
from flask.cli import ScriptInfo
from flask_cors import CORS
import numpy as np
from calamari_ocr.ocr.predict.predictor import Predictor, PredictorParams


def create_app(script_info: Optional[ScriptInfo] = None):
    app = Flask(__name__)
    CORS(app)

    ocr_model = Predictor.from_checkpoint(
        params=PredictorParams(),
        checkpoint='models/latest.ckpt')

    @app.route('/ocr', methods=["POST"])
    def ocr():
        images = [np.array(img) for img in request.json["images"]]

        predictions = [sample.outputs.sentence
                       for sample in ocr_model.predict_raw(images)]

        return {"predictions": predictions}

    app.logger.info(f'Starting ocr server')
    return app

