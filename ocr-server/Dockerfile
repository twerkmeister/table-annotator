FROM python:3.11

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y

RUN pip install --upgrade pip
RUN pip install poetry

WORKDIR app

COPY ocr /ocr/
COPY pyproject.toml poetry.lock /app/

RUN poetry install --no-interaction

COPY .flaskenv server.py /app/
COPY ocr_server /app/ocr_server
COPY models /app/models
COPY tests /app/tests/

CMD poetry run flask run --no-debugger --host=0.0.0.0 --port 5001
