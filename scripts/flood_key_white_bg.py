#!/usr/bin/env python3
"""Remove only white background connected to image borders.

Keeps interior highlights, dark pupils, eyebrows, and props intact.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def flood_key_white(input_path: Path, output_path: Path, tolerance: int = 24) -> None:
    src = Image.open(input_path).convert("RGB")
    arr = np.array(src, dtype=np.uint8)
    h, w, _ = arr.shape
    white_dist = np.max(255 - arr.astype(np.int16), axis=2)
    bg_candidate = white_dist <= tolerance

    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if bg_candidate[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg_candidate[y, x]:
                visited[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if (
                0 <= ny < h
                and 0 <= nx < w
                and not visited[ny, nx]
                and bg_candidate[ny, nx]
            ):
                visited[ny, nx] = True
                q.append((ny, nx))

    alpha = np.where(visited, 0, 255).astype(np.uint8)
    rgba = np.dstack([arr, alpha])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(output_path)


def export_square_icon(
    keyed_path: Path,
    output_path: Path,
    size: int = 192,
    padding: int = 8,
) -> None:
    src = Image.open(keyed_path).convert("RGBA")
    alpha = src.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 16 else 0).getbbox()
    if bbox is None:
        raise ValueError(f"No visible content in {keyed_path}")

    content = src.crop(bbox)
    inner = size - padding * 2
    scale = min(inner / content.width, inner / content.height)
    new_size = (
        max(1, int(content.width * scale)),
        max(1, int(content.height * scale)),
    )
    resized = content.resize(new_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - new_size[0]) // 2
    y = (size - new_size[1]) // 2
    canvas.paste(resized, (x, y), resized)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, optimize=True, compress_level=9)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--keyed-out")
    parser.add_argument("--size", type=int, default=192)
    parser.add_argument("--tolerance", type=int, default=24)
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    keyed_path = Path(args.keyed_out) if args.keyed_out else input_path.with_name(
        input_path.stem + "-keyed.png"
    )

    flood_key_white(input_path, keyed_path, tolerance=args.tolerance)
    export_square_icon(keyed_path, output_path, size=args.size)


if __name__ == "__main__":
    main()
