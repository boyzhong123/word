#!/usr/bin/env python3
"""Export today tab icons from high-res sources: clean white key + match study footprint."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SIZE = 96
PADDING = 6  # same inset as other nav jelly icons
SIZE_BOOST = 1.0


def near_white(rgb: np.ndarray, tol: int = 28) -> np.ndarray:
    dist = np.max(255 - rgb.astype(np.int16), axis=2)
    return dist <= tol


def flood_key_border(rgb: np.ndarray, tol: int = 28) -> np.ndarray:
    h, w, _ = rgb.shape
    bg = near_white(rgb, tol)
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bg[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    return visited


def defringe(alpha: np.ndarray, rgb: np.ndarray, tol: int = 238) -> np.ndarray:
    """Drop opaque near-white pixels that touch transparency (edge halos only)."""
    out = alpha.copy()
    near = (
        (rgb[:, :, 0] >= tol)
        & (rgb[:, :, 1] >= tol)
        & (rgb[:, :, 2] >= tol)
        & (out > 16)
    )
    transparent = out < 32
    touch = np.zeros_like(transparent)
    for dy, dx in (
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1),
        (-1, -1),
        (-1, 1),
        (1, -1),
        (1, 1),
    ):
        shifted = np.zeros_like(transparent)
        sy = slice(max(0, -dy), alpha.shape[0] - max(0, dy))
        sx = slice(max(0, -dx), alpha.shape[1] - max(0, dx))
        dy2 = slice(max(0, dy), alpha.shape[0] - max(0, -dy))
        dx2 = slice(max(0, dx), alpha.shape[1] - max(0, -dx))
        shifted[dy2, dx2] = transparent[sy, sx]
        touch |= shifted
    out[near & touch] = 0
    return out


def content_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 24 else 0)
    visible = visible.filter(ImageFilter.MinFilter(3))
    return visible.getbbox()


def study_footprint() -> tuple[int, int]:
    ref = Image.open(ROOT / "images/home/nav-study-jelly.png").convert("RGBA")
    bbox = content_bbox(ref)
    if bbox is None:
        raise ValueError("study reference icon has no visible content")
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def export_icon(source_path: Path, output_path: Path, target_w: int, target_h: int) -> None:
    src = Image.open(source_path).convert("RGB")
    rgb = np.array(src)
    visited = flood_key_border(rgb, tol=30)
    alpha = np.where(visited, 0, 255).astype(np.uint8)
    alpha = defringe(alpha, rgb, tol=238)
    keyed = Image.fromarray(np.dstack([rgb, alpha]), "RGBA")

    bbox = content_bbox(keyed)
    if bbox is None:
        raise ValueError(f"No visible content in {source_path}")
    content = keyed.crop(bbox)

    inner = SIZE - PADDING * 2
    scale_w = target_w / content.width
    scale_h = target_h / content.height
    scale = max(scale_w, scale_h)
    # today source is taller than study; cap height so it doesn't dominate the tab bar
    max_scale_h = (inner + 5) / content.height
    scale = min(scale, max_scale_h) * SIZE_BOOST
    new_size = (
        max(1, round(content.width * scale)),
        max(1, round(content.height * scale)),
    )
    resized = content.resize(new_size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    x = (SIZE - new_size[0]) // 2
    y = (SIZE - new_size[1]) // 2  # center like other nav icons
    canvas.alpha_composite(resized, (x, y))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, optimize=True, compress_level=9)


def main() -> None:
    target_w, target_h = study_footprint()
    pairs = (
        ("assets/nav-today-jelly-source.png", "images/home/nav-today-jelly.png"),
        ("assets/nav-today-jelly-active-source.png", "images/home/nav-today-jelly-active.png"),
    )
    for src_name, out_name in pairs:
        export_icon(ROOT / src_name, ROOT / out_name, target_w, target_h)
        out = ROOT / out_name
        img = Image.open(out).convert("RGBA")
        bbox = content_bbox(img)
        arr = np.array(img)
        opaque = arr[:, :, 3] > 16
        near_white = (
            opaque
            & (arr[:, :, 0] > 240)
            & (arr[:, :, 1] > 240)
            & (arr[:, :, 2] > 240)
        )
        bw = bbox[2] - bbox[0] if bbox else 0
        bh = bbox[3] - bbox[1] if bbox else 0
        print(f"Built {out_name}: {bw}x{bh}, near_white_opaque={near_white.sum()}")


if __name__ == "__main__":
    main()
