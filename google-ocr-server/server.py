from typing import Optional
import io
from flask import Flask, request
from flask.cli import ScriptInfo
from flask_cors import CORS
import numpy as np
import PIL.Image
from google.cloud import vision


def array_to_bytes_image(image: np.ndarray) -> io.BytesIO:
    """Detects text in the file."""
    pil_image = PIL.Image.fromarray(image.astype('uint8'))
    file_object = io.BytesIO()
    pil_image.save(file_object, 'JPEG')
    file_object.seek(0)
    return file_object


def create_app(script_info: Optional[ScriptInfo] = None):
    app = Flask(__name__)
    CORS(app)

    @app.route('/hello', methods=["GET", "POST"])
    def hello():
        return {"msg": "Hello World"}

    @app.route('/ocr', methods=["POST"])
    def ocr():
        vision_client = vision.ImageAnnotatorClient()
        images = [np.array(img, dtype="uint8") for img in request.json["images"]]
        images_as_bytes_io = [array_to_bytes_image(image)
                              for image in images]
        responses = [
            vision_client.document_text_detection(
                image=image,
                image_context={"language_hints": ["de-t-i0-handwrit"]}
            )
            for image in images_as_bytes_io]
        predictions = [response.text_annotations[0].description
                       if len(response.text_annotations) > 0 else ""
                       for response in responses]

        return {"predictions": predictions}

    app.logger.info(f'Starting google ocr server')
    return app

