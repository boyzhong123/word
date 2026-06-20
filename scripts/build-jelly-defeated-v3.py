#!/usr/bin/env python3
"""Drop jelly-defeated v3 keyed draft into home-map 166rpx (@3x) monster slots."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance

from flood_key_white_bg import (
    flood_key_white,
    surrender_flag_fabric_region,
)
from monster_frame_config import MONSTER_EXPORT_PX, MONSTER_EXPORT_SCALE

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
MONSTER_DIR = PROJECT_ROOT / "images/home/map/monsters"
VERCEL_MONSTER_DIR = PROJECT_ROOT / "vercel-assets/images/home/map/monsters"

RAW_SOURCE = ASSETS_DIR / "jelly-defeated-v3-draft-keyed-fixed.png"
KEYED_SOURCE = ASSETS_DIR / "jelly-defeated-v3-draft-keyed.png"
MONSTER_FRAME = MONSTER_EXPORT_PX
CARD_PADDING_LEFT = 6 * MONSTER_EXPORT_SCALE
CARD_PADDING_RIGHT = 8 * MONSTER_EXPORT_SCALE
CARD_PADDING_Y = 6 * MONSTER_EXPORT_SCALE
CONTENT_SCALE = 1.04
# Leave transparent headroom above the flag so the card sprite can sit higher
# without the pole tip crossing the card divider line.
CONTENT_TOP_BIAS = 10 * MONSTER_EXPORT_SCALE
COLOR_SATURATION = 1.30
COLOR_BRIGHTNESS = 0.88
FLAG_TARGET_RGB = (253.0, 244.0, 196.0)
FLAG_TINT_STRENGTH = 0.0


def surrender_flag_fabric_mask(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    return surrender_flag_fabric_region(rgb) & (alpha > 128)


def warm_surrender_flag(image: Image.Image) -> Image.Image:
    """Shift the surrender flag from cold gray-white to warm cream-yellow."""
    rgba = np.array(image.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    fabric = surrender_flag_fabric_mask(rgb.astype(np.uint8), alpha)
    if not fabric.any():
        return image

    blend = fabric.astype(np.float32) * FLAG_TINT_STRENGTH
    target = np.array(FLAG_TARGET_RGB, dtype=np.float32)
    for channel in range(3):
        rgb[:, :, channel] = rgb[:, :, channel] * (1 - blend) + target[channel] * blend

    rgba[:, :, :3] = np.clip(rgb, 0, 255)
    return Image.fromarray(rgba.astype(np.uint8), "RGBA")


def apply_monster_color_grade(image: Image.Image) -> Image.Image:
    """Grade the whole sprite, then warm-tint only the flag cloth."""
    graded = image.convert("RGBA")
    if COLOR_SATURATION != 1:
        graded = ImageEnhance.Color(graded).enhance(COLOR_SATURATION)
    if COLOR_BRIGHTNESS != 1:
        graded = ImageEnhance.Brightness(graded).enhance(COLOR_BRIGHTNESS)
    return warm_surrender_flag(graded)


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def resize_rgba(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Resize without punching holes in flat flag cloth during downscale."""
    resized = image.convert("RGBA").resize(size, Image.Resampling.LANCZOS)
    rgb = resized.convert("RGB")
    alpha = resized.getchannel("A").point(lambda value: 255 if value > 128 else 0)
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def fit_frame(image, frame_w, frame_h):
    box = content_bbox(image)
    if box is None:
        raise ValueError("frame source has no visible content")

    content = image.crop(box)
    content = apply_monster_color_grade(content)
    inner_w = frame_w - CARD_PADDING_LEFT - CARD_PADDING_RIGHT
    inner_h = frame_h - CARD_PADDING_Y * 2 - CONTENT_TOP_BIAS
    scale = min(inner_w / content.width, inner_h / content.height) * CONTENT_SCALE
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = resize_rgba(content, (width, height))

    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    x = (frame_w - width) // 2
    y = CONTENT_TOP_BIAS
    if y + height > frame_h - CARD_PADDING_Y:
        y = frame_h - CARD_PADDING_Y - height
    frame.alpha_composite(content, (x, y))
    return frame


def prepare_keyed_source() -> Image.Image:
    if not RAW_SOURCE.exists():
        raise FileNotFoundError(f"Missing source: {RAW_SOURCE}")

    # Use the curated source with the softer cloth flag, then key only the
    # border-connected white/gray background blocks.
    flood_key_white(
        RAW_SOURCE,
        KEYED_SOURCE,
        tolerance=16,
        restore_wood_props=False,
        restore_surrender_flag=False,
    )
    return Image.open(KEYED_SOURCE).convert("RGBA")


def main():
    source = prepare_keyed_source()
    frame = fit_frame(source, MONSTER_FRAME, MONSTER_FRAME)
    for out_dir in (MONSTER_DIR, VERCEL_MONSTER_DIR):
        out_dir.mkdir(parents=True, exist_ok=True)
        frame.save(out_dir / "jelly-defeated.png", optimize=True)
    print(f"Built jelly-defeated.png -> {MONSTER_DIR} & {VERCEL_MONSTER_DIR}")


if __name__ == "__main__":
    main()
