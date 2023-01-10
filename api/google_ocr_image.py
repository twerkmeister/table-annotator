import argparse
from typing import Text

from google.cloud import vision


def run_ocr(image_file: Text) -> Text:
    vision_client = vision.ImageAnnotatorClient()
    with open(image_file, "rb") as img:
        content = img.read()
    image = vision.Image(content=content)
    response = vision_client.text_detection(
        image=image,
        image_context={"language_hints": ["de-t-i0-handwrit"]}
    )
    text = response.text_annotations[0].description \
        if len(response.text_annotations) > 0 else ""

    output_file = image_file.replace(".jpg", ".pred.google.txt")

    with open(output_file, "w") as f:
        f.write(text)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Runs google ocr on a single image')
    parser.add_argument("image_path",
                        help='Path to the image for which you want to run ocr.')
    args = parser.parse_args()
    run_ocr(args.image_path)
