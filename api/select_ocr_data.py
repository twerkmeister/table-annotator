import argparse
import os
import glob
import shutil
import random
from typing import Text


def select_ocr_data(data_path: Text, target_path: Text) -> None:
    current_dir = os.getcwd()
    os.chdir(data_path)
    image_paths = glob.glob(f"**/*.jpg", recursive=True)
    random.shuffle(image_paths)

    words = set()

    os.makedirs(f"{current_dir}/{target_path}", exist_ok=True)

    for image_path in image_paths:
        ground_truth_path = f"{image_path[:-4]}.gt.txt"
        with open(f"{data_path}/{ground_truth_path}") as f:
            ground_truth = f.read()

        if ground_truth in words:
            continue

        words.add(ground_truth)

        image_destination_path = f"{current_dir}/{target_path}/{image_path}"
        ground_truth_destination_path = \
            f"{current_dir}/{target_path}/{ground_truth_path}"

        os.makedirs(os.path.dirname(image_destination_path), exist_ok=True)
        shutil.copy(image_path, image_destination_path)
        shutil.copy(ground_truth_path, ground_truth_destination_path)

    print("Total examples: ", len(image_paths))
    print("examples selected: ", len(words))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Selects specific OCR Data points for '
                                                 'better training data set diversity.')
    parser.add_argument("data_path",
                        help='Path to the folder which contains ocr images and their'
                             'ground truth.')

    parser.add_argument("target_path",
                        help='Path to the folder where you want to store the selected '
                             'data')

    args = parser.parse_args()
    select_ocr_data(args.data_path, args.target_path)
