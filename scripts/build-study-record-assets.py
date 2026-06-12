#!/usr/bin/env python3
"""Build study record page jelly icons from ImageGen source art."""

import subprocess
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RECORD_DIR = PROJECT_ROOT / "images" / "study-record"
ASSETS_DIR = PROJECT_ROOT / "assets"
WORK_DIR = RECORD_DIR / ".jelly-build"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

ICON_SET_COLUMNS = 7
ICON_SET_SIZE = 72
HERO_SIZE = 120

ICON_SET_MAPPING = {
    "icon-stat-new-words-jelly.png": 0,
    "icon-stat-practice-jelly.png": 1,
    "icon-stat-listen-jelly.png": 2,
    "icon-trend-new-jelly.png": 3,
    "icon-trend-read-jelly.png": 4,
    "icon-trend-quiz-jelly.png": 5,
    "icon-trend-recite-jelly.png": 6,
}

CHROMA_ARGS = [
    "--auto-key",
    "border",
    "--soft-matte",
    "--transparent-threshold",
    "12",
    "--opaque-threshold",
    "220",
    "--despill",
]


def resolve_source(name):
    for candidate in (ASSETS_DIR / name, PROJECT_ROOT / "assets" / name):
        if candidate.exists():
            return candidate
    cursor_assets = Path.home() / ".cursor/projects/Users-zhong-Downloads-proverbs/assets" / name
    if cursor_assets.exists():
        return cursor_assets
    raise FileNotFoundError(f"missing source asset: {name}")


def chroma_key(source_path, work_dir):
    keyed_path = work_dir / f"{source_path.stem}-keyed.png"
    if CHROMA_KEY_SCRIPT.exists():
        args = [
            sys.executable,
            str(CHROMA_KEY_SCRIPT),
            "--input",
            str(source_path),
            "--out",
            str(keyed_path),
            "--force",
        ] + CHROMA_ARGS
        subprocess.run(args, check=True)
        return Image.open(keyed_path).convert("RGBA")
    return Image.open(source_path).convert("RGBA")


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def fit_icon(image, size, padding=6):
    box = content_bbox(image)
    if box is None:
        raise ValueError(f"no visible content in {size}x{size}")
    content = image.crop(box)
    inner = size - padding * 2
    scale = min(inner / content.width, inner / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - width) // 2
    y = (size - height) // 2
    icon.alpha_composite(content, (x, y))
    return icon


def extract_icon(source, column_index, output_path, size=ICON_SET_SIZE):
    cell_width = source.width // ICON_SET_COLUMNS
    cell = source.crop(
        (
            column_index * cell_width,
            0,
            (column_index + 1) * cell_width,
            source.height,
        )
    )
    icon = fit_icon(cell, size=size)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    icon.save(output_path, optimize=True)


def build_icon_set(source_name):
    source_path = resolve_source(source_name)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    keyed = chroma_key(source_path, WORK_DIR)
    keyed_path = WORK_DIR / f"{source_path.stem}-keyed.png"
    keyed.save(keyed_path, optimize=True)
    for output_name, column_index in ICON_SET_MAPPING.items():
        extract_icon(keyed, column_index, RECORD_DIR / output_name)


def build_hero(source_name):
    source_path = resolve_source(source_name)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    keyed = chroma_key(source_path, WORK_DIR)
    icon = fit_icon(keyed, HERO_SIZE, padding=8)
    output_path = RECORD_DIR / "hero-mascot-jelly.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    icon.save(output_path, optimize=True)


def main():
    build_icon_set("study-record-icon-set-source.png")
    build_hero("study-record-hero-mascot-source.png")
    print(f"built study record assets in {RECORD_DIR}")


if __name__ == "__main__":
    main()
