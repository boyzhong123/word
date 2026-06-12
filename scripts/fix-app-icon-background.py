#!/usr/bin/env python3
"""Smooth app-icon background gradient while preserving foreground."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = PROJECT_ROOT / "assets" / "app-icon-mini-program-preferred-source.png"
DEFAULT_OUTPUT = PROJECT_ROOT / "assets" / "app-icon-mini-program-1024.png"
CANVAS = 1024

# Main sky tone from preferred source (y=40-90), not the darker top artifact band.
SKY_TOP = (104, 211, 253)
SKY_BOTTOM = (186, 251, 197)


def _rgb(px: tuple) -> tuple[int, int, int]:
    return px[:3] if len(px) >= 3 else px


def _dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return sum(abs(a[i] - b[i]) for i in range(3))


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _smoothstep(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def _sky_gradient(size: int) -> list[tuple[int, int, int]]:
    return [_lerp(SKY_TOP, SKY_BOTTOM, _smoothstep(y / max(size - 1, 1))) for y in range(size)]


def _is_foreground(rgb: tuple[int, int, int], bg: tuple[int, int, int]) -> bool:
    sat = max(rgb) - min(rgb)
    mx, mn = max(rgb), min(rgb)
    d = _dist(rgb, bg)

    if d <= 58:
        return False
    if mn >= 196 or mx <= 48:
        return True
    if d >= 72:
        return True
    return sat >= 82 and d >= 54


def fix_background(source: Path, output: Path, size: int = CANVAS) -> None:
    image = Image.open(source).convert("RGBA")
    if image.width != image.height:
        side = min(image.width, image.height)
        left = (image.width - side) // 2
        top = (image.height - side) // 2
        image = image.crop((left, top, left + side, top + side))

    gradient = _sky_gradient(image.height)
    rgba = image.load()
    w, h = image.size
    composed = Image.new("RGBA", (w, h))
    out = composed.load()

    for y in range(h):
        bg = gradient[y]
        for x in range(w):
            src = rgba[x, y]
            src_rgb = _rgb(src)
            if src[3] < 12 or not _is_foreground(src_rgb, bg):
                out[x, y] = (*bg, 255)
            else:
                out[x, y] = src

    final = composed.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    final.save(output, optimize=True)
    print(f"source={source.name} sky={SKY_TOP}->{SKY_BOTTOM} -> {output} {final.size}")


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT
    if not source.exists():
        raise SystemExit(f"source not found: {source}")
    fix_background(source, output)


if __name__ == "__main__":
    main()
