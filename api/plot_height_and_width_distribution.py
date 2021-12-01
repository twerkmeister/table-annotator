from typing import Text
import argparse
import matplotlib
from pathlib import Path
import table_annotator.img
import table_annotator.io
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def plot_height_and_width_distribution(images_path: Text) -> None:
    """Loads images and plots their height and width distribution."""
    image_paths = [str(path) for path in Path(images_path).rglob('**/*.jpg')]
    images = [table_annotator.io.read_image(img_path) for img_path in image_paths]
    width, height = zip(*[table_annotator.img.get_dimensions(img) for img in images])

    fig, axes = plt.subplots(1, 2)

    axes[0].hist(width, bins=20)
    axes[0].set_title("width")
    axes[1].hist(height, bins=range(0, 201, 10))
    axes[1].set_title("height")

    plt.savefig("height_and_width_plot.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Plots height and width distribution '
                                                 'of images')
    parser.add_argument("images_path",
                        help='folder with images to be analyzed')

    args = parser.parse_args()
    plot_height_and_width_distribution(args.images_path)