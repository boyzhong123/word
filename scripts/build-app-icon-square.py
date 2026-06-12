#!/usr/bin/env python3
"""Fit a landscape app-icon source into 1024x1024 without cropping content."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = PROJECT_ROOT / "assets" / "app-icon-mini-program-v6-source.png"
DEFAULT_OUTPUT = PROJECT_ROOT / "assets" / "app-icon-mini-program-1024.png"
CANVAS = 1024
MARGIN_RATIO = 0.06


def gradient_background(size: int) -> Image.Image:
    top = (91, 184, 255)
    bottom = (127, 232, 176)
    canvas = Image.new("RGB", (size, size))
    draw = ImageDraw.Draw(canvas)
    for y in range(size):
        t = y / max(size - 1, 1)
        color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line([(0, y), (size, y)], fill=color)
    return canvas


def fit_square(source: Path, output: Path, margin_ratio: float = MARGIN_RATIO) -> None:
    image = Image.open(source).convert("RGB")
    max_side = int(CANVAS * (1 - margin_ratio * 2))
    scale = min(max_side / image.width, max_side / image.height)
    width = max(1, int(round(image.width * scale)))
    height = max(1, int(round(image.height * scale)))
    scaled = image.resize((width, height), Image.Resampling.LANCZOS)

    canvas = gradient_background(CANVAS)
    offset = ((CANVAS - width) // 2, (CANVAS - height) // 2)
    canvas.paste(scaled, offset)
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, optimize=True)
    print(f"source={source.name} {image.size} -> fitted {width}x{height} -> {output}")


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT
    margin = float(sys.argv[3]) if len(sys.argv) > 3 else MARGIN_RATIO
    if not source.exists():
        raise SystemExit(f"source not found: {source}")
    fit_square(source, output, margin_ratio=margin)


if __name__ == "__main__":
    main()
