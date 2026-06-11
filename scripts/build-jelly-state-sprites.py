#!/usr/bin/env python3
"""Build jelly locked (sleeping) and defeated card sprites from official sources."""

import subprocess
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
MONSTER_DIR = PROJECT_ROOT / "images/home/map/monsters"
HOME_DIR = PROJECT_ROOT / "images/home"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

LOCKED_SHEET_DEFAULT = ASSETS_DIR / "jelly-locked-defeated-official-source.png"
DEFEATED_SOURCE_DEFAULT = ASSETS_DIR / "jelly-defeated-official-source-v3.png"
MONSTER_FRAME = 166
MASCOT_FRAME_W = 212
MASCOT_FRAME_H = 125
CARD_PADDING_X = 10
CARD_PADDING_Y = 12


def chroma_key(source_path, work_dir):
    source = Image.open(source_path).convert("RGBA")
    if source.mode == "RGBA" and source.getchannel("A").getextrema()[0] < 255:
        return source

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
        return Image.open(keyed_path).convert("RGBA")

    from PIL import ImageChops

    rgb = source.convert("RGB")
    white = Image.new("RGB", rgb.size, "white")
    diff = ImageChops.difference(rgb, white).convert("L")
    mask = diff.point(lambda value: 255 if value > 18 else 0)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(mask)
    return rgba


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def fit_frame(image, frame_w, frame_h, padding_x=CARD_PADDING_X, padding_y=CARD_PADDING_Y):
    box = content_bbox(image)
    if box is None:
        raise ValueError("frame source has no visible content")

    content = image.crop(box)
    inner_w = frame_w - padding_x * 2
    inner_h = frame_h - padding_y * 2
    scale = min(inner_w / content.width, inner_h / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)

    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    x = (frame_w - width) // 2
    y = frame_h - padding_y - height
    frame.alpha_composite(content, (x, y))
    return frame


def is_magenta_pixel(px):
    r, g, b = px[:3]
    return r > 180 and b > 180 and g < 110


def split_locked_from_sheet(source):
    pixels = source.load()
    width, height = source.size
    gap_cols = [
        x
        for x in range(width)
        if all(is_magenta_pixel(pixels[x, y]) for y in range(0, height, 4))
    ]
    mid_gaps = [x for x in gap_cols if width * 0.3 < x < width * 0.7]
    split_x = mid_gaps[len(mid_gaps) // 2] if mid_gaps else width // 2
    return source.crop((0, 0, split_x, height))


def build_single_sprite(source, output_path):
    frame = fit_frame(source, MONSTER_FRAME, MONSTER_FRAME)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    frame.save(output_path, optimize=True)
    return frame


def build_mascot_sprite(source_path, output_path, frame_count=4):
    source = Image.open(source_path).convert("RGBA")
    if source.size != (MASCOT_FRAME_W, MASCOT_FRAME_H):
        source = fit_frame(source, MASCOT_FRAME_W, MASCOT_FRAME_H, padding_x=12, padding_y=10)

    sprite = Image.new("RGBA", (MASCOT_FRAME_W * frame_count, MASCOT_FRAME_H), (0, 0, 0, 0))
    for index in range(frame_count):
        sprite.alpha_composite(source, (index * MASCOT_FRAME_W, 0))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(output_path, optimize=True)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Build jelly locked/defeated sprites.")
    parser.add_argument("--locked-sheet", default=str(LOCKED_SHEET_DEFAULT))
    parser.add_argument("--defeated-source", default=str(DEFEATED_SOURCE_DEFAULT))
    args = parser.parse_args()

    locked_sheet = Path(args.locked_sheet)
    defeated_source = Path(args.defeated_source)
    if not locked_sheet.exists():
        raise FileNotFoundError(f"Locked sheet not found: {locked_sheet}")
    if not defeated_source.exists():
        raise FileNotFoundError(f"Defeated source not found: {defeated_source}")

    work_dir = MONSTER_DIR / ".jelly-build"
    work_dir.mkdir(parents=True, exist_ok=True)

    locked_raw = split_locked_from_sheet(chroma_key(locked_sheet, work_dir))
    defeated_raw = chroma_key(defeated_source, work_dir)

    locked_raw.save(MONSTER_DIR / "jelly-green-monster-locked.png", optimize=True)
    defeated_raw.save(MONSTER_DIR / "jelly-green-monster-defeated.png", optimize=True)

    build_single_sprite(locked_raw, MONSTER_DIR / "jelly-locked.png")
    build_single_sprite(defeated_raw, MONSTER_DIR / "jelly-defeated.png")

    for mascot_name, raw in (
        ("mascot-sleep", locked_raw),
        ("mascot-progress", defeated_raw),
    ):
        mascot = fit_frame(raw, MASCOT_FRAME_W, MASCOT_FRAME_H, padding_x=12, padding_y=10)
        mascot.save(HOME_DIR / f"{mascot_name}.png", optimize=True)
        build_mascot_sprite(HOME_DIR / f"{mascot_name}.png", HOME_DIR / f"{mascot_name}-sprite.png")

    print("Built jelly-locked.png, jelly-defeated.png, mascot-sleep*, mascot-progress*")


if __name__ == "__main__":
    main()
