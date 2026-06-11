#!/usr/bin/env python3
"""Build word-new thumb and toast icons from generated source art."""

import subprocess
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORD_NEW_DIR = PROJECT_ROOT / "images" / "word-new"
ASSETS_DIR = PROJECT_ROOT / "assets"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

THUMB_SIZE = 72
TOAST_SIZE = 128

SOURCE_FILES = {
    "thumb-up.png": ("thumb-up-source.png", THUMB_SIZE, THUMB_SIZE, 4, False),
    "thumb-down.png": ("thumb-down-source.png", THUMB_SIZE, THUMB_SIZE, 4, False),
    "toast-known.png": ("toast-known-source.png", TOAST_SIZE, TOAST_SIZE, 6, True),
    "toast-unknown.png": ("toast-unknown-source.png", TOAST_SIZE, TOAST_SIZE, 6, True),
    "toast-mistaken.png": ("toast-mistaken-source.png", TOAST_SIZE, TOAST_SIZE, 6, True),
}


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def fit_asset(image, width, height, padding):
    box = content_bbox(image)
    if box is None:
        raise ValueError("source image has no visible content")

    content = image.crop(box)
    inner_w = width - padding * 2
    inner_h = height - padding * 2
    scale = min(inner_w / content.width, inner_h / content.height)
    target_w = max(1, round(content.width * scale))
    target_h = max(1, round(content.height * scale))
    content = content.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - target_w) // 2
    y = (height - target_h) // 2
    canvas.alpha_composite(content, (x, y))
    return canvas


def remove_checkerboard(source_path, work_dir):
    keyed_path = work_dir / f"{source_path.stem}-keyed.png"
    if CHROMA_KEY_SCRIPT.exists():
        args = [
            sys.executable,
            str(CHROMA_KEY_SCRIPT),
            "--input",
            str(source_path),
            "--out",
            str(keyed_path),
            "--key-color",
            "#ededed",
            "--tolerance",
            "24",
            "--soft-matte",
            "--force",
        ]
        subprocess.run(args, check=True)
        return Image.open(keyed_path).convert("RGBA")

    image = Image.open(source_path).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if max(r, g, b) - min(r, g, b) <= 8 and (r + g + b) / 3 >= 210:
                pixels[x, y] = (r, g, b, 0)
    return image


def resolve_source(name):
    candidates = [
        ASSETS_DIR / name,
        PROJECT_ROOT / "assets" / name,
        WORD_NEW_DIR / ".build" / name,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"missing source asset: {name}")


def main():
    work_dir = WORD_NEW_DIR / ".build"
    work_dir.mkdir(parents=True, exist_ok=True)
    WORD_NEW_DIR.mkdir(parents=True, exist_ok=True)

    for output_name, (source_name, width, height, padding, keyed) in SOURCE_FILES.items():
        source_path = resolve_source(source_name)
        image = remove_checkerboard(source_path, work_dir) if keyed else Image.open(source_path).convert("RGBA")
        icon = fit_asset(image, width, height, padding)
        icon.save(WORD_NEW_DIR / output_name, optimize=True)
        print(f"built {WORD_NEW_DIR / output_name}")


if __name__ == "__main__":
    main()
