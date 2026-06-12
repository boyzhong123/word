#!/usr/bin/env python3
"""Build check-in share poster backgrounds at exact 600x960 portrait."""

from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
OUT_DIR = PROJECT_ROOT / "images" / "checkin"

POSTER_WIDTH = 600
POSTER_HEIGHT = 960
POSTER_RATIO = POSTER_WIDTH / POSTER_HEIGHT

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


def crop_to_poster_ratio(image: Image.Image) -> Image.Image:
    width, height = image.size
    src_ratio = width / height
    if src_ratio > POSTER_RATIO:
        crop_h = height
        crop_w = round(height * POSTER_RATIO)
        left = (width - crop_w) // 2
        top = 0
    else:
        crop_w = width
        crop_h = round(width / POSTER_RATIO)
        left = 0
        top = (height - crop_h) // 2
    return image.crop((left, top, left + crop_w, top + crop_h))


def build_one(source_name: str, output_name: str) -> None:
    source_path = ASSETS_DIR / source_name
    if not source_path.exists():
        raise FileNotFoundError(f"missing source asset: {source_path}")

    image = Image.open(source_path).convert("RGB")
    cropped = crop_to_poster_ratio(image)
    poster = cropped.resize((POSTER_WIDTH, POSTER_HEIGHT), Image.Resampling.LANCZOS)
    out_path = OUT_DIR / output_name
    poster.save(out_path, optimize=True)
    print(f"built {out_path} from {source_path.name} ({image.size[0]}x{image.size[1]} -> {POSTER_WIDTH}x{POSTER_HEIGHT})")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for output_name, source_name in SOURCE_FILES.items():
        build_one(source_name, output_name)


if __name__ == "__main__":
    main()
