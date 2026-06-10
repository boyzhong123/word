#!/usr/bin/env python3
"""Render the home view-mode toggle button icons (map / category).

Icons are drawn as solid white glyphs on a transparent background so they sit
on the blue floating button. Each glyph is built on a high-resolution alpha
mask and downsampled with LANCZOS for smooth, crisp edges at small sizes.
"""

from pathlib import Path
from PIL import Image, ImageDraw

OUT_DIR = Path(__file__).resolve().parent.parent / "images" / "home"
SIZE = 96          # final pixel size (square)
SS = 8             # supersampling factor
S = SIZE * SS      # working canvas size
WHITE = (255, 255, 255, 255)


def rounded_rect(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def finish(mask):
    """Turn an L-mode alpha mask into a downsampled white RGBA icon."""
    mask = mask.resize((SIZE, SIZE), Image.LANCZOS)
    icon = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 0))
    white = Image.new("RGBA", (SIZE, SIZE), WHITE)
    icon = Image.composite(white, icon, mask)
    return icon


def build_map():
    """A location pin (teardrop) with a hollow center — reads as 'map'."""
    mask = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(mask)

    cx = S / 2
    head_cy = S * 0.40
    r = S * 0.255
    tip_y = S * 0.86

    # Round head of the pin.
    d.ellipse([cx - r, head_cy - r, cx + r, head_cy + r], fill=255)
    # Pointed tail: triangle from the lower flanks of the head down to the tip.
    flank = r * 0.74
    fy = head_cy + r * 0.66
    d.polygon([(cx - flank, fy), (cx + flank, fy), (cx, tip_y)], fill=255)
    # Hollow center hole.
    hr = r * 0.42
    d.ellipse([cx - hr, head_cy - hr, cx + hr, head_cy + hr], fill=0)

    return finish(mask)


def build_category():
    """A 2x2 grid of rounded squares — reads as 'categories'."""
    mask = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(mask)

    margin = S * 0.14
    gap = S * 0.12
    cell = (S - 2 * margin - gap) / 2
    radius = cell * 0.30

    for row in range(2):
        for col in range(2):
            x0 = margin + col * (cell + gap)
            y0 = margin + row * (cell + gap)
            rounded_rect(d, [x0, y0, x0 + cell, y0 + cell], radius, 255)

    return finish(mask)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_map().save(OUT_DIR / "view-toggle-map.png")
    build_category().save(OUT_DIR / "view-toggle-category.png")
    print("wrote view-toggle-map.png and view-toggle-category.png to", OUT_DIR)


if __name__ == "__main__":
    main()
