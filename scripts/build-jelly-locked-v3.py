#!/usr/bin/env python3
"""Drop jelly-locked v3 keyed draft into home-map 166rpx (@3x) monster slots."""

from pathlib import Path

from PIL import Image, ImageEnhance

from monster_frame_config import MONSTER_EXPORT_PX, MONSTER_EXPORT_SCALE

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
MONSTER_DIR = PROJECT_ROOT / "images/home/map/monsters"
VERCEL_MONSTER_DIR = PROJECT_ROOT / "vercel-assets/images/home/map/monsters"

SOURCE = ASSETS_DIR / "jelly-locked-v3-draft-keyed.png"
MONSTER_FRAME = MONSTER_EXPORT_PX
CARD_PADDING_LEFT = 8 * MONSTER_EXPORT_SCALE
CARD_PADDING_RIGHT = 12 * MONSTER_EXPORT_SCALE
CARD_PADDING_Y = 8 * MONSTER_EXPORT_SCALE
COLOR_SATURATION = 1.18


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def fit_frame(image, frame_w, frame_h):
    box = content_bbox(image)
    if box is None:
        raise ValueError("frame source has no visible content")

    content = image.crop(box)
    if COLOR_SATURATION != 1:
        content = ImageEnhance.Color(content).enhance(COLOR_SATURATION)
    inner_w = frame_w - CARD_PADDING_LEFT - CARD_PADDING_RIGHT
    inner_h = frame_h - CARD_PADDING_Y * 2
    scale = min(inner_w / content.width, inner_h / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)

    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    x = (frame_w - width) // 2
    y = max(CARD_PADDING_Y, (frame_h - height) // 2 - 6 * MONSTER_EXPORT_SCALE)
    frame.alpha_composite(content, (x, y))
    return frame


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source: {SOURCE}")
    source = Image.open(SOURCE).convert("RGBA")
    frame = fit_frame(source, MONSTER_FRAME, MONSTER_FRAME)
    for out_dir in (MONSTER_DIR, VERCEL_MONSTER_DIR):
        out_dir.mkdir(parents=True, exist_ok=True)
        frame.save(out_dir / "jelly-locked.png", optimize=True)
    print(f"Built jelly-locked.png -> {MONSTER_DIR} & {VERCEL_MONSTER_DIR}")


if __name__ == "__main__":
    main()
