#!/usr/bin/env python3
"""Build study-plan mascot icons.

Prefer imagegen output via scripts/generate-plan-mascot.sh.
This crop-based fallback remains for offline rebuilds only.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MONSTER_DIR = ROOT / "images/home/map/monsters"
OUT_DIR = ROOT / "images/plan"
ICON_SIZE = 192
FIGHTING_FRAMES = 6


def content_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    visible = visible.filter(ImageFilter.MinFilter(3))
    return visible.getbbox()


def fit_icon(image: Image.Image, size: int = ICON_SIZE, padding: int = 10) -> Image.Image:
    box = content_bbox(image)
    if box is None:
        raise ValueError("source has no visible content")

    content = image.crop(box)
    inner = size - padding * 2
    scale = min(inner / content.width, inner / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - width) // 2
    y = size - padding - height
    canvas.alpha_composite(content, (x, y))
    return canvas


def crop_left_character(image: Image.Image, split_ratio: float = 0.62) -> Image.Image:
    """Keep the jelly body on locked art and drop the padlock on the right."""
    width = max(1, round(image.width * split_ratio))
    return image.crop((0, 0, width, image.height))


def extract_fighting_frame(source: Image.Image, index: int = 0) -> Image.Image:
    cell_width = source.width // FIGHTING_FRAMES
    left = index * cell_width
    return source.crop((left, 0, left + cell_width, source.height))


def export_icon(source: Image.Image, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fit_icon(source, size=ICON_SIZE).save(output_path, optimize=True)


def main() -> None:
    locked = Image.open(MONSTER_DIR / "jelly-locked.png").convert("RGBA")
    fighting = Image.open(MONSTER_DIR / "jelly-fighting.png").convert("RGBA")
    defeated = Image.open(MONSTER_DIR / "jelly-defeated.png").convert("RGBA")

    export_icon(crop_left_character(locked), OUT_DIR / "plan-mascot-easy.png")
    export_icon(extract_fighting_frame(fighting, 0), OUT_DIR / "plan-mascot-normal.png")
    export_icon(defeated, OUT_DIR / "plan-mascot-hard.png")

    print("Built plan mascots from homepage jelly map monsters:")
    for name in ("plan-mascot-easy.png", "plan-mascot-normal.png", "plan-mascot-hard.png"):
        print(f"  {OUT_DIR / name}")


if __name__ == "__main__":
    main()
