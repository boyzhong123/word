#!/usr/bin/env python3
"""Prepare girl PK cutouts and build gender-specific home assets."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))
from flood_key_white_bg import flood_key_white

PROJECT_ROOT = SCRIPT_DIR.parent
PARTS_DIR = PROJECT_ROOT / "assets/pk-build/pk-parts"
HOME_DIR = PROJECT_ROOT / "images/home"
HERO_SIZE = (1536, 640)
BOOK_CARD_SPLICE_Y = 640
STUDENT_FOOT_SCAN_X = (80, 420)


def detect_student_foot_bottom(arr: np.ndarray) -> int | None:
    """Return the lowest row containing student shoes in the left hero lane."""
    h = arr.shape[0]
    x0, x1 = STUDENT_FOOT_SCAN_X
    roi = arr[:, x0:x1]
    for y in range(h - 1, 350, -1):
        row = roi[y]
        red, green, blue = row[:, 0], row[:, 1], row[:, 2]
        pink = (red > 130) & (green > 80) & (green < 200) & (blue < 170) & (red > green)
        blue_shoe = (blue > 120) & (red < 140) & (blue > red)
        white = row.min(axis=1) > 200
        if pink.sum() + blue_shoe.sum() + white.sum() > 40:
            return y
    return None


def boy_foot_anchor(boy_arr: np.ndarray) -> int:
    return detect_student_foot_bottom(boy_arr) or 614


def apply_book_card_lawn(girl_arr: np.ndarray, boy_arr: np.ndarray) -> np.ndarray:
    out = girl_arr.copy()
    out[BOOK_CARD_SPLICE_Y:, :, :] = boy_arr[BOOK_CARD_SPLICE_Y:, :, :]
    return out


def align_student_feet_to_boy(girl_arr: np.ndarray, boy_arr: np.ndarray) -> np.ndarray:
    """Shift girl hero content so shoes sit on the same row as the boy header."""
    target_foot = boy_foot_anchor(boy_arr)
    foot_y = detect_student_foot_bottom(girl_arr)
    if foot_y is None or foot_y <= target_foot:
        return girl_arr

    shift = foot_y - target_foot
    h = girl_arr.shape[0]
    out = np.zeros_like(girl_arr)
    out[: h - shift, :, :] = girl_arr[shift:h, :, :]
    out[BOOK_CARD_SPLICE_Y:, :, :] = boy_arr[BOOK_CARD_SPLICE_Y:, :, :]
    return out

GIRL_PARTS = {
    "girl-idle.png": "girl-idle-source.png",
    "girl-attack.png": "girl-attack-source.png",
    "girl-cheer.png": "girl-cheer-source.png",
}


def content_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    visible = visible.filter(ImageFilter.MinFilter(3))
    return visible.getbbox()


def restore_interior_white(
    image: Image.Image,
    white_tolerance: int = 30,
    dilate_radius: int = 16,
) -> Image.Image:
    """Reclaim near-white shirt/sock pixels removed by border-connected flood key."""
    arr = np.array(image).copy()
    alpha = arr[:, :, 3]
    rgb = arr[:, :, :3]
    opaque = alpha > 128

    mask_img = Image.fromarray((opaque.astype(np.uint8) * 255))
    for _ in range(dilate_radius):
        mask_img = mask_img.filter(ImageFilter.MaxFilter(3))
    envelope = np.array(mask_img) > 128

    white_dist = np.max(255 - rgb.astype(np.int16), axis=2)
    restore = envelope & (white_dist <= white_tolerance) & ~opaque
    arr[restore, 3] = 255
    return Image.fromarray(arr, "RGBA")


def keyed_source(source_path: Path, work_dir: Path) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    if source.mode == "RGBA" and source.getchannel("A").getextrema()[0] < 255:
        return source

    keyed_path = work_dir / f"{source_path.stem}-keyed.png"
    flood_key_white(source_path, keyed_path, tolerance=24)
    keyed = Image.open(keyed_path).convert("RGBA")
    restored = restore_interior_white(keyed)
    restored.save(keyed_path, optimize=True)
    return restored


def fit_cutout(image: Image.Image, target_height: int) -> Image.Image:
    box = content_bbox(image)
    if box is None:
        raise ValueError("cutout has no visible content")
    content = image.crop(box)
    scale = target_height / content.height
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    return content.resize((width, height), Image.Resampling.LANCZOS)


def prepare_girl_parts():
    work_dir = PARTS_DIR / ".girl-build"
    work_dir.mkdir(parents=True, exist_ok=True)
    boy_idle = Image.open(PARTS_DIR / "boy-idle.png")
    target_height = boy_idle.height

    for output_name, source_name in GIRL_PARTS.items():
        source_path = PARTS_DIR / source_name
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        keyed = keyed_source(source_path, work_dir)
        cutout = fit_cutout(keyed, target_height)
        cutout.save(PARTS_DIR / output_name, optimize=True)
        print(f"Prepared {output_name} ({cutout.width}x{cutout.height})")


def prepare_girl_hero(source_path: Path, output_path: Path):
    """Export the girl hero banner using the same framing as the boy v5 header."""
    boy_hero_path = HOME_DIR / "hero-campus-jelly-v5.png"
    target_w, target_h = HERO_SIZE
    source = Image.open(source_path).convert("RGB")

    if source.size != (target_w, target_h):
        source = source.resize((target_w, target_h), Image.Resampling.LANCZOS)

    girl_arr = np.array(source)
    if boy_hero_path.exists():
        boy_arr = np.array(Image.open(boy_hero_path).convert("RGB"))
        girl_arr = align_student_feet_to_boy(girl_arr, boy_arr)
        girl_arr = apply_book_card_lawn(girl_arr, boy_arr)
        foot_y = detect_student_foot_bottom(girl_arr)
        anchor = boy_foot_anchor(boy_arr)
        print(f"Aligned girl hero feet to row {foot_y} (boy anchor {anchor})")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(girl_arr).save(output_path, optimize=True)
    print(f"Saved hero banner {output_path} ({HERO_SIZE[0]}x{HERO_SIZE[1]})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--hero-source",
        default=str(PROJECT_ROOT / "assets/hero-campus-jelly-v5-girl-source.png"),
        help="ImageGen girl hero source; should match boy v5 framing (1536x640).",
    )
    args = parser.parse_args()

    prepare_girl_parts()
    prepare_girl_hero(Path(args.hero_source), HOME_DIR / "hero-campus-jelly-v5-girl.png")

    subprocess.run(
        [sys.executable, str(PROJECT_ROOT / "scripts/build-pk-sprite.py"), "--gender", "girl"],
        check=True,
    )


if __name__ == "__main__":
    main()
