#!/usr/bin/env python3
"""Build check-in share poster backgrounds at exact 600x960 portrait (5:8)."""

from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
OUT_DIR = PROJECT_ROOT / "images" / "checkin"

# Canvas logical size; export is scaled by device dpr (2x/3x).
POSTER_WIDTH = 600
POSTER_HEIGHT = 960
POSTER_RATIO = POSTER_WIDTH / POSTER_HEIGHT

# Preferred source size: exact 5:8 portrait, high-res enough for dpr=3 export.
SOURCE_WIDTH = 1280
SOURCE_HEIGHT = 2048

SOURCE_FILES = {
    "share-bg-today-monster.png": "share-bg-today-monster-source.png",
    "share-bg-today-pk.png": "share-bg-today-pk-source.png",
    "share-bg-today-words.png": "share-bg-today-words-source.png",
    "share-bg-streak-monster.png": "share-bg-streak-monster-source.png",
    "share-bg-streak-pk.png": "share-bg-streak-pk-source.png",
    "share-bg-streak-words.png": "share-bg-streak-words-source.png",
    "share-bg-today-monster-light.png": "share-bg-today-monster-light-source.png",
    "share-bg-today-pk-light.png": "share-bg-today-pk-light-source.png",
    "share-bg-today-words-light.png": "share-bg-today-words-light-source.png",
    "share-bg-streak-monster-light.png": "share-bg-streak-monster-light-source.png",
    "share-bg-streak-pk-light.png": "share-bg-streak-pk-light-source.png",
    "share-bg-streak-words-light.png": "share-bg-streak-words-light-source.png",
}


def is_poster_ratio(width: int, height: int, tolerance: float = 0.02) -> bool:
    return abs((width / height) - POSTER_RATIO) <= tolerance


def cover_crop_to_poster(image: Image.Image, width: int, height: int) -> Image.Image:
    """Aspect-fill to exact poster size, anchored to the top center."""
    src_w, src_h = image.size
    if src_w == width and src_h == height:
        return image

    scale = max(width / src_w, height / src_h)
    resized = image.resize(
        (round(src_w * scale), round(src_h * scale)),
        Image.Resampling.LANCZOS,
    )
    left = max((resized.width - width) // 2, 0)
    top = 0
    return resized.crop((left, top, left + width, top + height))


def build_one(source_name: str, output_name: str) -> None:
    source_path = ASSETS_DIR / source_name
    if not source_path.exists():
        raise FileNotFoundError(f"missing source asset: {source_path}")

    image = Image.open(source_path).convert("RGB")
    if not is_poster_ratio(image.width, image.height):
        print(
            f"warn {source_path.name}: {image.width}x{image.height} is not 5:8; "
            f"cover-cropping to {SOURCE_WIDTH}x{SOURCE_HEIGHT}"
        )

    normalized = cover_crop_to_poster(image, SOURCE_WIDTH, SOURCE_HEIGHT)
    poster = normalized.resize((POSTER_WIDTH, POSTER_HEIGHT), Image.Resampling.LANCZOS)
    out_path = OUT_DIR / output_name
    poster.save(out_path, optimize=True)
    print(
        f"built {out_path} from {source_path.name} "
        f"({image.width}x{image.height} -> {POSTER_WIDTH}x{POSTER_HEIGHT})"
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for output_name, source_name in SOURCE_FILES.items():
        build_one(source_name, output_name)


if __name__ == "__main__":
    main()
