#!/usr/bin/env python3
"""Build flat advertisement stat icons matching the book-cover logo style."""

from pathlib import Path

from PIL import Image, ImageDraw

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = PROJECT_ROOT / "images" / "home" / "ad"

BLUE = (75, 159, 232)
BLUE_LIGHT = (184, 217, 240)
BLUE_BG = (232, 244, 253)
GREEN = (61, 217, 104)
GREEN_DARK = (43, 184, 90)
WHITE = (255, 255, 255)


def rounded_rect(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def draw_word_icon(size=192):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 96
    rounded_rect(draw, (24 * s, 14 * s, 72 * s, 82 * s), 10 * s, BLUE)
    rounded_rect(draw, (30 * s, 20 * s, 66 * s, 76 * s), 6 * s, WHITE)
    rounded_rect(draw, (34 * s, 26 * s, 62 * s, 36 * s), 3 * s, BLUE)
    rounded_rect(draw, (34 * s, 42 * s, 56 * s, 46 * s), 2 * s, BLUE_LIGHT)
    rounded_rect(draw, (34 * s, 50 * s, 52 * s, 54 * s), 2 * s, BLUE_LIGHT)
    rounded_rect(draw, (34 * s, 58 * s, 58 * s, 62 * s), 2 * s, BLUE_LIGHT)
    draw.ellipse((40 * s, 64 * s, 56 * s, 80 * s), fill=GREEN)
    draw.ellipse((43 * s, 67 * s, 47 * s, 71 * s), fill=GREEN_DARK)
    return img


def draw_proverb_icon(size=192):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 96
    stroke = max(2, int(4.5 * s))
    rounded_rect(draw, (14 * s, 16 * s, 82 * s, 66 * s), 14 * s, BLUE)
    rounded_rect(draw, (20 * s, 22 * s, 76 * s, 60 * s), 10 * s, WHITE)
    draw.arc((24 * s, 28 * s, 36 * s, 52 * s), 110, 300, fill=BLUE, width=stroke)
    draw.arc((30 * s, 28 * s, 42 * s, 52 * s), 110, 300, fill=BLUE, width=stroke)
    draw.arc((54 * s, 28 * s, 66 * s, 52 * s), 240, 430, fill=BLUE, width=stroke)
    draw.arc((60 * s, 28 * s, 72 * s, 52 * s), 240, 430, fill=BLUE, width=stroke)
    rounded_rect(draw, (36 * s, 38 * s, 60 * s, 42 * s), 2 * s, BLUE_LIGHT)
    rounded_rect(draw, (36 * s, 46 * s, 54 * s, 50 * s), 2 * s, BLUE_LIGHT)
    rounded_rect(draw, (36 * s, 54 * s, 58 * s, 58 * s), 2 * s, BLUE_LIGHT)
    draw.polygon([(30 * s, 66 * s), (22 * s, 74 * s), (30 * s, 74 * s)], fill=BLUE)
    draw.ellipse((54 * s, 52 * s, 70 * s, 68 * s), fill=GREEN)
    return img


def draw_review_icon(size=192):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 96
    stroke = max(2, int(5.5 * s))
    draw.ellipse((16 * s, 16 * s, 80 * s, 80 * s), fill=BLUE_BG)
    draw.arc((26 * s, 26 * s, 70 * s, 70 * s), 35, 205, fill=BLUE, width=stroke)
    draw.polygon(
        [
            (22 * s, 40 * s),
            (30 * s, 48 * s),
            (24 * s, 50 * s),
        ],
        fill=BLUE,
    )
    draw.arc((26 * s, 26 * s, 70 * s, 70 * s), 215, 385, fill=BLUE_LIGHT, width=stroke)
    draw.polygon(
        [
            (74 * s, 56 * s),
            (66 * s, 48 * s),
            (72 * s, 46 * s),
        ],
        fill=BLUE_LIGHT,
    )
    rounded_rect(draw, (40 * s, 40 * s, 56 * s, 56 * s), 5 * s, BLUE)
    draw.ellipse((43 * s, 43 * s, 53 * s, 53 * s), fill=GREEN)
    return img


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    icons = {
        "icon-word-jelly.png": draw_word_icon,
        "icon-proverb-jelly.png": draw_proverb_icon,
        "icon-review-jelly.png": draw_review_icon,
    }
    for name, builder in icons.items():
        out = OUT_DIR / name
        builder(192).resize((96, 96), Image.Resampling.LANCZOS).save(out, optimize=True)
        print(f"built {out}")


if __name__ == "__main__":
    main()
