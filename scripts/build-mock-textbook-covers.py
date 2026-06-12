#!/usr/bin/env python3
"""Generate demo textbook covers for the book picker catalog (dev-only mock data).

Outputs images/home/mock-cover-01.png .. mock-cover-10.png, styled after
mainstream English textbook covers: solid two-tone gradient, big white
「英语」 title with an "English" caption and a footer band.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "images" / "home"
WIDTH, HEIGHT = 300, 400

FONT_CANDIDATES = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
]

# (top color, bottom color) pairs, loosely matching the reference palette
PALETTES = [
    ((201, 44, 64), (164, 25, 48)),     # red
    ((64, 196, 222), (30, 158, 196)),   # cyan
    ((124, 195, 66), (88, 160, 38)),    # green
    ((240, 158, 36), (214, 122, 14)),   # orange
    ((52, 120, 206), (28, 86, 168)),    # blue
    ((219, 85, 178), (184, 48, 146)),   # magenta
    ((38, 166, 154), (16, 128, 118)),   # teal
    ((142, 94, 200), (108, 62, 168)),   # purple
    ((232, 116, 60), (200, 84, 30)),    # vermilion
    ((96, 170, 240), (58, 130, 206)),   # sky blue
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    raise SystemExit("no CJK font found")


def draw_centered(draw: ImageDraw.ImageDraw, y: int, text: str, font, fill) -> None:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    draw.text(((WIDTH - (right - left)) / 2 - left, y - top), text, font=font, fill=fill)


def build_cover(index: int, top_color, bottom_color) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT))
    for y in range(HEIGHT):
        ratio = y / (HEIGHT - 1)
        pixel = tuple(
            round(top + (bottom - top) * ratio)
            for top, bottom in zip(top_color, bottom_color)
        )
        ImageDraw.Draw(image).line([(0, y), (WIDTH, y)], fill=pixel)

    draw = ImageDraw.Draw(image)

    # header strip: 义务教育教科书 style caption
    draw_centered(draw, 22, "义务教育教科书", load_font(16), (255, 255, 255))

    # main title
    draw_centered(draw, 96, "英语", load_font(86), (255, 255, 255))
    draw_centered(draw, 206, "English", load_font(44), (255, 255, 255))

    # footer band
    draw.rectangle([(0, HEIGHT - 46), (WIDTH, HEIGHT)], fill=(255, 255, 255))
    draw_centered(draw, HEIGHT - 36, "演示教材 · 仅供预览", load_font(18), bottom_color)

    output = OUTPUT_DIR / f"mock-cover-{index:02d}.png"
    image.save(output, optimize=True)
    print(f"wrote {output.relative_to(PROJECT_ROOT)}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for index, (top_color, bottom_color) in enumerate(PALETTES, start=1):
        build_cover(index, top_color, bottom_color)


if __name__ == "__main__":
    main()
