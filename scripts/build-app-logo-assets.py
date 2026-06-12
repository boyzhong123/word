#!/usr/bin/env python3
"""Build in-app and store logo assets from the canonical app icon source."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = PROJECT_ROOT / "assets" / "app-logo-source.png"
BLACK_THRESH = 20

OUTPUTS = {
    "images/app-logo.png": 256,
    "images/checkin/share-poster-logo.png": 256,
    "images/home/icon-book-picker-jelly.png": 128,
    "images/mini-program-icon-1024.png": 1024,
    "assets/app-icon-mini-program-1024.png": 1024,
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


def _ui_logo(image: Image.Image, size: int) -> Image.Image:
    return image.resize((size, size), Image.Resampling.LANCZOS)


def _store_icon(image: Image.Image, size: int) -> Image.Image:
    return image.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)


def build_all(source: Path) -> None:
    square = _prepare_square(Image.open(source))
    for rel_path, size in OUTPUTS.items():
        output = PROJECT_ROOT / rel_path
        logo = _ui_logo(square, size) if size < 1024 else _store_icon(square, size)
        output.parent.mkdir(parents=True, exist_ok=True)
        logo.save(output, optimize=True)
        print(f"source={source.name} -> {output} {logo.size}")


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    if not source.exists():
        raise SystemExit(f"source not found: {source}")
    build_all(source)


if __name__ == "__main__":
    main()
