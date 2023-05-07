FROM python:3.9

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y

RUN pip install --upgrade pip
RUN pip install poetry

WORKDIR app

COPY pyproject.toml poetry.lock /app/

RUN poetry install --no-interaction
RUN poetry run pip install calamari-ocr==2.2.2 tensorflow-addons==0.16.1 tensorflow==2.6.5

COPY .flaskenv server.py /app/
COPY ocr_server /app/ocr_server
COPY models /app/models
COPY tests /app/tests/

CMD poetry run flask run --no-debugger --host=0.0.0.0 --port 5001
