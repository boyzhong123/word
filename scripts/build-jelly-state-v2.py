#!/usr/bin/env python3
"""Rebuild jelly defeated/locked 166px monster sprites from the v2 keyed drafts.

Uses the same fit_frame placement as scripts/build-jelly-state-sprites.py so the
new artwork drops into the existing home-map monster slots unchanged.
"""

from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
MONSTER_DIR = PROJECT_ROOT / "images/home/map/monsters"
VERCEL_MONSTER_DIR = PROJECT_ROOT / "vercel-assets/images/home/map/monsters"

MONSTER_FRAME = 166
CARD_PADDING_X = 10
CARD_PADDING_Y = 12

SOURCES = {
    "jelly-defeated.png": ASSETS_DIR / "jelly-defeated-v3-draft-keyed.png",
    "jelly-locked.png": ASSETS_DIR / "jelly-locked-v2-draft-keyed.png",
}


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


def main():
    for name, source_path in SOURCES.items():
        if not source_path.exists():
            raise FileNotFoundError(f"Missing source: {source_path}")
        source = Image.open(source_path).convert("RGBA")
        frame = fit_frame(source, MONSTER_FRAME, MONSTER_FRAME)
        for out_dir in (MONSTER_DIR, VERCEL_MONSTER_DIR):
            out_dir.mkdir(parents=True, exist_ok=True)
            frame.save(out_dir / name, optimize=True)
        print(f"Built {name} -> {MONSTER_DIR} & {VERCEL_MONSTER_DIR}")


if __name__ == "__main__":
    main()
