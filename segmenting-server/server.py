from typing import Optional
from flask import Flask, request
from flask.cli import ScriptInfo
from flask_cors import CORS
import numpy as np
import table_segmenter.model
import table_segmenter.preprocessing
import table_segmenter.segment_table


def create_app(script_info: Optional[ScriptInfo] = None):
    app = Flask(__name__)
    CORS(app)

    model = table_segmenter.model.load_model("models/latest")
    @app.route('/segment', methods=["POST"])
    def segment():
        table_image = np.array(request.json["table_image"])
        rows = table_segmenter.segment_table.segment_table(model, table_image)
        return {"rows": rows}

    app.logger.info(f'Starting segmenter server')
    return app

