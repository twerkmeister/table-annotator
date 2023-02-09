FROM python:3.9

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 git -y

RUN pip install --upgrade pip
RUN pip install poetry

WORKDIR app

COPY pyproject.toml poetry.lock /app/

RUN poetry install --no-interaction

COPY .flaskenv server.py /app/
COPY segmenting_server /app/segmenting_server/
COPY tests /app/tests/
COPY models /app/models

CMD poetry run flask run --no-debugger --host=0.0.0.0 --port 5002
