#!/usr/bin/env python3
"""Prepare girl PK cutouts and build gender-specific home assets."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PARTS_DIR = PROJECT_ROOT / "assets/pk-build/pk-parts"
HOME_DIR = PROJECT_ROOT / "images/home"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"
HERO_SIZE = (1536, 1024)

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


def remove_near_white(image: Image.Image) -> Image.Image:
    rgb = image.convert("RGB")
    white = Image.new("RGB", rgb.size, "white")
    diff = ImageChops.difference(rgb, white).convert("L")
    mask = diff.point(lambda value: 255 if value > 18 else 0)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(mask)
    return rgba


def keyed_source(source_path: Path, work_dir: Path) -> Image.Image:
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
    return remove_near_white(source)


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
    source = Image.open(source_path).convert("RGB")
    if source.size != HERO_SIZE:
        source = source.resize(HERO_SIZE, Image.Resampling.LANCZOS)

    if boy_hero_path.exists():
        boy = Image.open(boy_hero_path).convert("RGB")
        boy_grass = np.array(boy)[640:, :, :]
        girl_arr = np.array(source)
        # Keep the boy header's lower lawn band so the book card overlap matches.
        girl_arr[640:, :, :] = boy_grass
        source = Image.fromarray(girl_arr)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    source.save(output_path, optimize=True)
    print(f"Saved hero banner {output_path} ({HERO_SIZE[0]}x{HERO_SIZE[1]})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--hero-source",
        default=str(PROJECT_ROOT / "assets/hero-campus-jelly-v5-girl-source.png"),
        help="ImageGen girl hero source; should match boy v5 framing (1536x1024).",
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
