#!/usr/bin/env python3
"""Build in-app and store logo assets from the canonical app icon source."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = PROJECT_ROOT / "assets" / "app-logo-source.png"
BLACK_THRESH = 20
CORNER_RADIUS_RATIO = 0.18
# White inner ring + dark outer ring so the logo reads on both light and dark poster backgrounds.
STROKE_WHITE_PX = 5
STROKE_DARK_PX = 3

OUTPUTS = {
    "images/app-logo.png": (256, True),
    "images/checkin/share-poster-logo.png": (256, True),
    "images/home/icon-book-picker-jelly.png": (128, False),
    "images/mini-program-icon-1024.png": (1024, False),
    "assets/app-icon-mini-program-1024.png": (1024, False),
}


def _detect_inset(arr: np.ndarray, thresh: int = BLACK_THRESH) -> int:
    height, width = arr.shape[:2]

    def is_background(px: np.ndarray) -> bool:
        return px[0] <= thresh and px[1] <= thresh and px[2] <= thresh

    for inset in range(min(height, width) // 2):
        corners = [
            arr[inset, inset],
            arr[inset, width - 1 - inset],
            arr[height - 1 - inset, inset],
            arr[height - 1 - inset, width - 1 - inset],
        ]
        if all(not is_background(corner) for corner in corners):
            return inset
    return 0


def _prepare_square(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    arr = np.array(rgba.convert("RGB"))
    inset = _detect_inset(arr)
    width, height = rgba.size
    return rgba.crop((inset, inset, width - inset, height - inset))


def _rounded_logo(image: Image.Image) -> Image.Image:
    side = image.width
    mask = Image.new("L", (side, side), 0)
    draw = ImageDraw.Draw(mask)
    radius = max(8, int(side * CORNER_RADIUS_RATIO))
    draw.rounded_rectangle((0, 0, side - 1, side - 1), radius=radius, fill=255)

    rounded = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    rounded.paste(image, (0, 0), mask)
    return rounded


def _dilate_alpha(alpha: Image.Image, radius: int) -> Image.Image:
    if radius <= 0:
        return alpha
    size = radius * 2 + 1
    return alpha.filter(ImageFilter.MaxFilter(size))


def _stroke_layer(size: tuple[int, int], alpha: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    layer = Image.new("RGBA", size, color)
    layer.putalpha(alpha)
    return layer


def _add_dual_stroke(
    image: Image.Image,
    white_px: int = STROKE_WHITE_PX,
    dark_px: int = STROKE_DARK_PX,
) -> Image.Image:
    alpha = image.split()[3]
    pad = white_px + dark_px + 2
    out_w, out_h = image.width + pad * 2, image.height + pad * 2
    out = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))

    dark_alpha = _dilate_alpha(alpha, white_px + dark_px)
    white_alpha = _dilate_alpha(alpha, white_px)

    out.paste(_stroke_layer(image.size, dark_alpha, (24, 28, 36, 255)), (pad - dark_px, pad - dark_px), dark_alpha)
    out.paste(_stroke_layer(image.size, white_alpha, (255, 255, 255, 255)), (pad, pad), white_alpha)
    out.paste(image, (pad, pad), image)
    return out


def _build_logo(image: Image.Image, size: int, with_stroke: bool) -> Image.Image:
    rounded = _rounded_logo(image)
    if with_stroke:
        rounded = _add_dual_stroke(rounded)
    return rounded.resize((size, size), Image.Resampling.LANCZOS)


def _store_icon(image: Image.Image, size: int) -> Image.Image:
    return image.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)


def build_all(source: Path) -> None:
    square = _prepare_square(Image.open(source))
    for rel_path, (size, with_stroke) in OUTPUTS.items():
        output = PROJECT_ROOT / rel_path
        logo = _build_logo(square, size, with_stroke) if size < 1024 else _store_icon(square, size)
        output.parent.mkdir(parents=True, exist_ok=True)
        logo.save(output, optimize=True)
        stroke_note = " stroke" if with_stroke else ""
        print(f"source={source.name} -> {output} {logo.size}{stroke_note}")


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    if not source.exists():
        raise SystemExit(f"source not found: {source}")
    build_all(source)


if __name__ == "__main__":
    main()
