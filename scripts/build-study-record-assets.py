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

ICON_SIZE = 96
HERO_SIZE = 136

# source filename -> list of output filenames
INDIVIDUAL_ICONS = {
    "study-record-detail-new-words-source.png": [
        "icon-detail-new-words-jelly.png",
        "icon-stat-new-words-jelly.png",
        "icon-trend-new-jelly.png",
    ],
    "study-record-detail-read-word-source.png": [
        "icon-detail-read-word-jelly.png",
        "icon-trend-read-jelly.png",
    ],
    "study-record-detail-read-sentence-source.png": [
        "icon-detail-read-sentence-jelly.png",
    ],
    "study-record-detail-quiz-source.png": [
        "icon-detail-quiz-jelly.png",
        "icon-trend-quiz-jelly.png",
    ],
    "study-record-detail-recite-source.png": [
        "icon-detail-recite-jelly.png",
        "icon-trend-recite-jelly.png",
    ],
    "study-record-detail-review-source.png": [
        "icon-detail-review-jelly.png",
    ],
    "study-record-stat-practice-source.png": [
        "icon-stat-practice-jelly.png",
    ],
    "study-record-stat-listen-source.png": [
        "icon-stat-listen-jelly.png",
    ],
}

GREEN_CHROMA_ARGS = [
    "--key-color",
    "#00ff00",
    "--tolerance",
    "38",
]

HERO_CHROMA_ARGS = [
    "--auto-key",
    "border",
    "--transparent-threshold",
    "12",
    "--opaque-threshold",
    "220",
]


def resolve_source(name):
    for candidate in (ASSETS_DIR / name, PROJECT_ROOT / "assets" / name):
        if candidate.exists():
            return candidate
    cursor_assets = Path.home() / ".cursor/projects/Users-zhong-Downloads-proverbs/assets" / name
    if cursor_assets.exists():
        return cursor_assets
    raise FileNotFoundError(f"missing source asset: {name}")


def chroma_key(source_path, work_dir, chroma_args):
    keyed_path = work_dir / f"{source_path.stem}-keyed.png"
    if CHROMA_KEY_SCRIPT.exists():
        subprocess.run(
            [
                sys.executable,
                str(CHROMA_KEY_SCRIPT),
                "--input",
                str(source_path),
                "--out",
                str(keyed_path),
                "--force",
            ]
            + chroma_args,
            check=True,
        )
        return Image.open(keyed_path).convert("RGBA")
    return Image.open(source_path).convert("RGBA")


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def fit_icon(image, size, padding=8, padding_top=None):
    box = content_bbox(image)
    if box is None:
        raise ValueError(f"no visible content in {size}x{size}")
    content = image.crop(box)
    top_pad = padding_top if padding_top is not None else padding
    inner_w = size - padding * 2
    inner_h = size - padding - top_pad
    scale = min(inner_w / content.width, inner_h / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - width) // 2
    y = top_pad + max(0, (inner_h - height) // 2)
    icon.alpha_composite(content, (x, y))
    return icon


def build_individual_icons():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    RECORD_DIR.mkdir(parents=True, exist_ok=True)
    for source_name, outputs in INDIVIDUAL_ICONS.items():
        source_path = resolve_source(source_name)
        keyed = chroma_key(source_path, WORK_DIR, GREEN_CHROMA_ARGS)
        icon = fit_icon(keyed, ICON_SIZE, padding=8)
        for output_name in outputs:
            icon.save(RECORD_DIR / output_name, optimize=True)


def build_hero(source_name):
    source_path = resolve_source(source_name)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    keyed = chroma_key(source_path, WORK_DIR, HERO_CHROMA_ARGS)
    icon = fit_icon(keyed, HERO_SIZE, padding=10, padding_top=16)
    output_path = RECORD_DIR / "hero-mascot-jelly.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    icon.save(output_path, optimize=True)


def main():
    build_individual_icons()
    build_hero("study-record-hero-mascot-source.png")
    print(f"built study record assets in {RECORD_DIR}")


if __name__ == "__main__":
    main()
