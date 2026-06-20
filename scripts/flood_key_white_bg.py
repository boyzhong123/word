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

NEIGHBORS = ((-1, 0), (1, 0), (0, -1), (0, 1))
NEIGHBORS_8 = (
    (-1, 0),
    (1, 0),
    (0, -1),
    (0, 1),
    (-1, -1),
    (-1, 1),
    (1, -1),
    (1, 1),
)


def near_white_mask(rgb: np.ndarray, tolerance: int) -> np.ndarray:
    white_dist = np.max(255 - rgb.astype(np.int16), axis=2)
    return white_dist <= tolerance


def detect_wood_mask(rgb: np.ndarray) -> np.ndarray:
    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    return (
        (red > 90)
        & (red < 210)
        & (green > 50)
        & (green < 170)
        & (blue < 120)
        & (red > green)
    )


def restore_near_white_from_wood_props(
    rgb: np.ndarray,
    alpha: np.ndarray,
    wood_pad: int = 135,
    white_tolerance: int = 40,
) -> np.ndarray:
    """Reclaim white props attached to a wooden pole (e.g. surrender flags)."""
    wood = detect_wood_mask(rgb)
    if not wood.any():
        return alpha

    coords = np.argwhere(wood)
    y0 = max(0, int(coords[:, 0].min()) - wood_pad)
    y1 = min(rgb.shape[0], int(coords[:, 0].max()) + wood_pad + 1)
    x0 = max(0, int(coords[:, 1].min()) - wood_pad)
    x1 = min(rgb.shape[1], int(coords[:, 1].max()) + wood_pad + 1)

    near_white = near_white_mask(rgb, white_tolerance)
    in_box = np.zeros(rgb.shape[:2], dtype=bool)
    in_box[y0:y1, x0:x1] = True

    attached = wood.copy()
    q: deque[tuple[int, int]] = deque(map(tuple, np.argwhere(wood)))
    while q:
        y, x = q.popleft()
        for dy, dx in NEIGHBORS:
            ny, nx = y + dy, x + dx
            if (
                0 <= ny < rgb.shape[0]
                and 0 <= nx < rgb.shape[1]
                and not attached[ny, nx]
                and in_box[ny, nx]
                and near_white[ny, nx]
            ):
                attached[ny, nx] = True
                q.append((ny, nx))

    restored = alpha.copy()
    restore = attached & (alpha <= 128)
    restored[restore] = 255
    return restored


def detect_pole_bbox(rgb: np.ndarray) -> tuple[int, int, int, int] | None:
    """Return y0, x0, y1, x1 for the surrender-flag pole in defeated jelly art."""
    wood = detect_wood_mask(rgb)
    pole = wood.copy()
    pole[:, :240] = False
    pole[:, 380:] = False
    pole[500:, :] = False
    if not pole.any():
        return None
    coords = np.argwhere(pole)
    py0, px0 = coords.min(axis=0)
    py1, px1 = coords.max(axis=0)
    return int(py0), int(px0), int(py1), int(px1)


def surrender_flag_cloth_region(rgb: np.ndarray) -> np.ndarray:
    """Tight cloth/pole neighborhood used for flag keying and tinting."""
    pole = detect_pole_bbox(rgb)
    if pole is None:
        return np.zeros(rgb.shape[:2], dtype=bool)

    py0, px0, py1, px1 = pole
    h, w = rgb.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    return (
        (xx >= px0 - 175)
        & (xx <= px0 + 8)
        & (yy >= py0 - 205)
        & (yy <= py1 + 5)
    )


def surrender_flag_matte_corner(rgb: np.ndarray) -> np.ndarray:
    cloth = surrender_flag_cloth_region(rgb)
    pole = detect_pole_bbox(rgb)
    if pole is None:
        return np.zeros(rgb.shape[:2], dtype=bool)

    py0, px0, _py1, _px1 = pole
    yy, xx = np.ogrid[:rgb.shape[0], :rgb.shape[1]]
    return cloth & (xx < px0 - 110) & (yy < py0 - 140)


def surrender_flag_pure_matte(rgb: np.ndarray) -> np.ndarray:
    """Border-connected white padding around the flag, not actual cloth."""
    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    lum = np.maximum(np.maximum(red, green), blue)
    sat = lum - np.minimum(np.minimum(red, green), blue)
    return near_white_mask(rgb, 6) & (sat < 6)


def surrender_flag_fabric_region(rgb: np.ndarray) -> np.ndarray:
    """Flag cloth pixels excluding pole, jelly, and outer white matte."""
    cloth = surrender_flag_cloth_region(rgb)
    matte_corner = surrender_flag_matte_corner(rgb)
    pure_matte = surrender_flag_pure_matte(rgb)
    wood = detect_wood_mask(rgb)
    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    jelly = (green > red + 12) & (green > blue + 8) & (green > 70)
    lum = np.maximum(np.maximum(red, green), blue)
    sat = lum - np.minimum(np.minimum(red, green), blue)
    return (
        cloth
        & ~matte_corner
        & ~pure_matte
        & ~jelly
        & ~wood
        & (near_white_mask(rgb, 45) | ((sat < 75) & (lum > 95)))
    )


def surrender_flag_attached_mask(rgb: np.ndarray) -> np.ndarray:
    """Pole + flag cloth reachable from the pole without crossing pure matte."""
    pole = detect_pole_bbox(rgb)
    if pole is None:
        return np.zeros(rgb.shape[:2], dtype=bool)

    h, w = rgb.shape[:2]
    cloth = surrender_flag_cloth_region(rgb)
    matte_corner = surrender_flag_matte_corner(rgb)
    pure_matte = surrender_flag_pure_matte(rgb)
    wood = detect_wood_mask(rgb)
    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    jelly = (green > red + 12) & (green > blue + 8) & (green > 70)
    lum = np.maximum(np.maximum(red, green), blue)
    sat = lum - np.minimum(np.minimum(red, green), blue)
    flag_canvas = cloth & ~matte_corner & ~pure_matte & ~jelly
    passable = flag_canvas & (wood | (sat >= 4))

    attached = wood.copy()
    q: deque[tuple[int, int]] = deque(map(tuple, np.argwhere(wood)))
    while q:
        y, x = q.popleft()
        for dy, dx in NEIGHBORS_8:
            ny, nx = y + dy, x + dx
            if (
                0 <= ny < h
                and 0 <= nx < w
                and not attached[ny, nx]
                and passable[ny, nx]
            ):
                attached[ny, nx] = True
                q.append((ny, nx))
    return attached


def clean_surrender_flag_matte(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Drop opaque matte blocks that sit outside the real pole/flag silhouette."""
    pole = detect_pole_bbox(rgb)
    if pole is None:
        return alpha

    py0, px0, py1, px1 = pole
    h, w = alpha.shape
    yy, xx = np.ogrid[:h, :w]
    flag_rect = (
        (xx >= px0 - 95)
        & (xx <= px1 + 55)
        & (yy >= py0 - 245)
        & (yy <= py1 + 10)
    )
    attached = surrender_flag_attached_mask(rgb)
    red = rgb[:, :, 0].astype(np.int16)
    green = rgb[:, :, 1].astype(np.int16)
    blue = rgb[:, :, 2].astype(np.int16)
    jelly = (green > red + 12) & (green > blue + 8) & (green > 70)
    near_white = near_white_mask(rgb, 40)
    stray = (
        flag_rect
        & ~attached
        & ~jelly
        & near_white
        & (alpha > 128)
    )
    cleaned = alpha.copy()
    cleaned[stray] = 0
    return cleaned


def restore_surrender_flag_alpha(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Re-opaque only the pole and flag cloth connected to it."""
    if detect_pole_bbox(rgb) is None:
        return alpha

    matte_corner = surrender_flag_matte_corner(rgb)
    pure_matte = surrender_flag_pure_matte(rgb)
    attached = surrender_flag_attached_mask(rgb)
    fabric = surrender_flag_fabric_region(rgb)
    keep = attached | fabric

    restored = alpha.copy()
    restored[(alpha <= 128) & keep] = 255
    restored[matte_corner | pure_matte] = 0
    return restored


def flood_key_white(
    input_path: Path,
    output_path: Path,
    tolerance: int = 24,
    *,
    restore_wood_props: bool = True,
    wood_pad: int = 135,
    restore_surrender_flag: bool = False,
) -> None:
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
        for dy, dx in NEIGHBORS:
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
    if restore_wood_props:
        alpha = restore_near_white_from_wood_props(arr, alpha, wood_pad=wood_pad)
    if restore_surrender_flag:
        alpha = restore_surrender_flag_alpha(arr, alpha)
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
