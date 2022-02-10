FROM python:3.7

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y

RUN pip install --upgrade pip
RUN pip install poetry

WORKDIR app

COPY pyproject.toml poetry.lock /app/

RUN poetry install --no-interaction

COPY .flaskenv api.py extract_ocr_data.py extract_table_delimiter_data.py /app/
COPY table_annotator /app/table_annotator/
COPY tests /app/tests/

CMD poetry run flask run --no-debugger --host=0.0.0.0
