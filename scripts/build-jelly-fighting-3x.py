#!/usr/bin/env python3
"""Upscale the map fighting strip to @3x export for retina trail cards."""

from pathlib import Path

from PIL import Image

from monster_frame_config import MONSTER_DISPLAY_RPX, MONSTER_EXPORT_PX

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MONSTER_DIR = PROJECT_ROOT / "images/home/map/monsters"
VERCEL_MONSTER_DIR = PROJECT_ROOT / "vercel-assets/images/home/map/monsters"
SOURCE = MONSTER_DIR / "jelly-fighting.png"
FRAME_COUNT = 6


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source: {SOURCE}")

    source = Image.open(SOURCE).convert("RGBA")
    frame_w = source.width // FRAME_COUNT
    frame_h = source.height
    if frame_w == MONSTER_EXPORT_PX and frame_h == MONSTER_EXPORT_PX:
        print(f"jelly-fighting.png already @3x ({source.width}x{frame_h})")
        return
    if frame_w != MONSTER_DISPLAY_RPX or frame_h != MONSTER_DISPLAY_RPX:
        raise ValueError(
            f"Unexpected jelly-fighting frame size {frame_w}x{frame_h}; "
            f"expected {MONSTER_DISPLAY_RPX}px or {MONSTER_EXPORT_PX}px export"
        )

    upscaled = source.resize(
        (MONSTER_EXPORT_PX * FRAME_COUNT, MONSTER_EXPORT_PX),
        Image.Resampling.LANCZOS,
    )
    for out_dir in (MONSTER_DIR, VERCEL_MONSTER_DIR):
        out_dir.mkdir(parents=True, exist_ok=True)
        upscaled.save(out_dir / "jelly-fighting.png", optimize=True)
    print(f"Built jelly-fighting.png @3x -> {MONSTER_DIR} & {VERCEL_MONSTER_DIR}")


if __name__ == "__main__":
    main()
