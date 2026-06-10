#!/usr/bin/env python3

import argparse
from pathlib import Path

from PIL import Image


ICON_SIZE = 96
CONTENT_SIZE = 88
OUTPUT_NAMES = ("stage-star-filled.png", "stage-star-empty.png")


def get_content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def build_icon(source):
    box = get_content_bbox(source)
    if box is None:
        raise ValueError("Each source half must contain a visible star")

    content = source.crop(box)
    scale = min(CONTENT_SIZE / content.width, CONTENT_SIZE / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)

    icon = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    x = (ICON_SIZE - width) // 2
    y = (ICON_SIZE - height) // 2
    icon.alpha_composite(content, (x, y))
    return icon


def build_stage_stars(source_path, output_dir):
    source = Image.open(source_path).convert("RGBA")
    split_x = source.width // 2
    halves = (
        source.crop((0, 0, split_x, source.height)),
        source.crop((split_x, 0, source.width, source.height)),
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    for half, output_name in zip(halves, OUTPUT_NAMES):
        build_icon(half).save(output_dir / output_name, optimize=True)


def main():
    parser = argparse.ArgumentParser(
        description="Split a transparent ImageGen source sheet into stage-star icons."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    build_stage_stars(args.source, args.output_dir)


if __name__ == "__main__":
    main()