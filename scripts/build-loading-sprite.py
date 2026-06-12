#!/usr/bin/env python3

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image

FRAME_WIDTH = 160
FRAME_HEIGHT = 160
FRAME_PADDING_X = 8
FRAME_PADDING_Y = 10
GRID_COLS = 3
GRID_ROWS = 2
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"


def get_content_bbox(image, alpha_threshold=32):
    if image.mode == "RGBA":
        alpha = image.getchannel("A")
        visible = alpha.point(lambda value: 255 if value > alpha_threshold else 0)
        return visible.getbbox()

    white = Image.new("RGB", image.size, "white")
    from PIL import ImageChops

    difference = ImageChops.difference(image, white).convert("L")
    mask = difference.point(lambda value: 255 if value > 18 else 0)
    return mask.getbbox()


def clean_panel_artifacts(image):
    """Remove leftover panel borders and soft halos from generated frame sheets."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0:
                continue

            minimum = min(red, green, blue)
            maximum = max(red, green, blue)
            spread = maximum - minimum

            if minimum > 188 and spread < 36:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            if maximum < 72 and alpha < 220:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            if alpha < 28:
                pixels[x, y] = (0, 0, 0, 0)

    return rgba


def ensure_transparent_source(source_path, work_dir):
    source = Image.open(source_path)
    if source.mode == "RGBA" and source.getchannel("A").getextrema()[0] < 255:
        return source_path

    keyed_path = work_dir / f"{source_path.stem}-keyed.png"
    if not CHROMA_KEY_SCRIPT.exists():
        raise FileNotFoundError(f"Chroma key helper not found: {CHROMA_KEY_SCRIPT}")

    subprocess.run(
        [
            sys.executable,
            str(CHROMA_KEY_SCRIPT),
            "--input",
            str(source_path),
            "--out",
            str(keyed_path),
            "--auto-key",
            "border",
            "--soft-matte",
            "--transparent-threshold",
            "12",
            "--opaque-threshold",
            "220",
            "--despill",
            "--force",
        ],
        check=True,
    )
    return keyed_path


BUILD_WORK_DIR = Path(__file__).resolve().parent.parent / "assets" / "build-work"


def build_sprite(source_path, output_path, frame_count=6):
    work_dir = BUILD_WORK_DIR
    work_dir.mkdir(parents=True, exist_ok=True)
    keyed_source = ensure_transparent_source(source_path, work_dir)
    source = Image.open(keyed_source).convert("RGBA")
    tile_width = source.width // GRID_COLS
    tile_height = source.height // GRID_ROWS
    tiles = []
    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            if len(tiles) >= frame_count:
                break
            tiles.append(
                source.crop(
                    (
                        col * tile_width,
                        row * tile_height,
                        (col + 1) * tile_width,
                        (row + 1) * tile_height,
                    )
                )
            )

    cleaned_tiles = [clean_panel_artifacts(tile) for tile in tiles]
    boxes = [get_content_bbox(tile) for tile in cleaned_tiles]
    if any(box is None for box in boxes):
        raise ValueError("Every source cell must contain a visible frame")

    max_width = max(box[2] - box[0] for box in boxes)
    max_height = max(box[3] - box[1] for box in boxes)
    scale = min(
        (FRAME_WIDTH - FRAME_PADDING_X * 2) / max_width,
        (FRAME_HEIGHT - FRAME_PADDING_Y * 2) / max_height,
    )

    sprite = Image.new("RGBA", (FRAME_WIDTH * frame_count, FRAME_HEIGHT), (0, 0, 0, 0))
    for index, (tile, box) in enumerate(zip(cleaned_tiles, boxes)):
        content = tile.crop(box)
        width = max(1, round(content.width * scale))
        height = max(1, round(content.height * scale))
        content = content.resize((width, height), Image.Resampling.LANCZOS)
        x = index * FRAME_WIDTH + (FRAME_WIDTH - width) // 2
        y = FRAME_HEIGHT - FRAME_PADDING_Y - height
        sprite.paste(content, (x, y), content)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(output_path, optimize=True)


def main():
    parser = argparse.ArgumentParser(
        description="Convert a 2x3 ImageGen frame sheet into a transparent horizontal loading sprite."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--frames", type=int, default=6)
    args = parser.parse_args()
    build_sprite(args.source, args.output, args.frames)


if __name__ == "__main__":
    main()
