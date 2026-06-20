#!/usr/bin/env python3
"""Key, unify jelly color, and export study-plan mascot icons from imagegen sources."""

from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image

from flood_key_white_bg import export_square_icon, flood_key_white

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets"
OUT_DIR = ROOT / "images/plan"
FIGHTING_REF = ROOT / "images/home/map/monsters/jelly-fighting.png"
ICON_SIZE = 192
FIGHTING_FRAMES = 6

MASCOTS = (
    ("easy", 10, False),
    ("normal", 8, False),
    ("hard", 4, True),
)


def jelly_body_mask(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    yellow = (red > 145) & (green > 145) & (blue < 130)
    near_white = (red > 225) & (green > 225) & (blue > 225)
    jelly = (
        (alpha > 128)
        & (green > red + 10)
        & (green > blue + 6)
        & (green > 55)
    )
    return jelly & ~yellow & ~near_white


def jelly_color_stats(image: Image.Image, mask: np.ndarray | None = None) -> np.ndarray:
    rgba = np.array(image.convert("RGBA"))
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    use_mask = jelly_body_mask(rgb, alpha) if mask is None else mask
    if not use_mask.any():
        raise ValueError("No jelly pixels found for color stats")
    return rgb[use_mask].astype(np.float32).mean(axis=0)


def load_fighting_reference_mean() -> np.ndarray:
    source = Image.open(FIGHTING_REF).convert("RGBA")
    cell_width = source.width // FIGHTING_FRAMES
    frame = source.crop((0, 0, cell_width, source.height))
    return jelly_color_stats(frame)


def match_jelly_color(image: Image.Image, ref_mean: np.ndarray) -> Image.Image:
    """Scale jelly pixels so their mean RGB matches the PK fighting reference."""
    rgba = np.array(image.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    mask = jelly_body_mask(rgb.astype(np.uint8), alpha.astype(np.uint8))
    if not mask.any():
        return image

    pixels = rgb[mask]
    src_mean = np.maximum(pixels.mean(axis=0), 1.0)
    scale = ref_mean / src_mean
    rgb[mask] = np.clip(pixels * scale, 0, 255)
    return Image.fromarray(rgba.astype(np.uint8), "RGBA")


def _load_defeated_helpers():
    module_path = ROOT / "scripts/build-jelly-defeated-v3.py"
    spec = importlib.util.spec_from_file_location("build_jelly_defeated_v3", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def export_mascot(
    source_path: Path,
    output_path: Path,
    *,
    padding: int,
    restore_surrender_flag: bool,
    ref_mean: np.ndarray,
) -> None:
    keyed_path = source_path.with_name(source_path.stem + "-keyed.png")
    flood_key_white(
        source_path,
        keyed_path,
        tolerance=24,
        restore_surrender_flag=restore_surrender_flag,
    )

    export_square_icon(keyed_path, output_path, size=ICON_SIZE, padding=padding)

    matched = match_jelly_color(Image.open(output_path).convert("RGBA"), ref_mean)
    if restore_surrender_flag:
        defeated = _load_defeated_helpers()
        matched = defeated.warm_surrender_flag(matched)
    matched.save(output_path, optimize=True, compress_level=9)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--only",
        choices=[name for name, _, _ in MASCOTS],
        help="Build one mascot instead of all three.",
    )
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ref_mean = load_fighting_reference_mean()
    print(f"PK jelly reference mean RGB: {tuple(ref_mean.round(1))}")

    for name, padding, restore_flag in MASCOTS:
        if args.only and args.only != name:
            continue
        source = ASSET_DIR / f"plan-mascot-{name}-source.png"
        if not source.exists():
            raise FileNotFoundError(f"Missing source: {source}")
        output = OUT_DIR / f"plan-mascot-{name}.png"
        export_mascot(
            source,
            output,
            padding=padding,
            restore_surrender_flag=restore_flag,
            ref_mean=ref_mean,
        )
        mean = jelly_color_stats(Image.open(output))
        print(f"Built {output} jelly mean RGB: {tuple(mean.round(1))}")


if __name__ == "__main__":
    main()
