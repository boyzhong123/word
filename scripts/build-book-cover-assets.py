#!/usr/bin/env python3
"""Build book cover thumbnails from ImageGen sources."""

from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HOME_DIR = PROJECT_ROOT / "images" / "home"
CURSOR_ASSETS = Path.home() / ".cursor/projects/Users-zhong-Downloads-proverbs/assets"

COVER_W = 308
COVER_H = 456


def resolve_source(name):
    for candidate in (ASSETS_DIR / name, CURSOR_ASSETS / name):
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"missing source asset: {name}")


def crop_portrait_cover(image, width, height):
    target_ratio = width / height
    src_ratio = image.width / image.height
    if src_ratio > target_ratio:
        crop_h = image.height
        crop_w = round(crop_h * target_ratio)
    else:
        crop_w = image.width
        crop_h = round(crop_w / target_ratio)
    left = max(0, (image.width - crop_w) // 2)
    top = max(0, (image.height - crop_h) // 2)
    cropped = image.crop((left, top, left + crop_w, top + crop_h))
    return cropped.resize((width, height), Image.Resampling.LANCZOS)


def build_cover(out_name, source_name):
    src = resolve_source(source_name)
    img = Image.open(src).convert("RGB")
    cover = crop_portrait_cover(img, COVER_W, COVER_H)
    out = HOME_DIR / out_name
    cover.save(out, format="PNG", optimize=True)
    print(f"built {out} {cover.size}")


def main():
    HOME_DIR.mkdir(parents=True, exist_ok=True)
    build_cover("book-cover.png", "book-cover-primary-source.png")
    build_cover("book-cover-secondary.png", "book-cover-secondary-source.png")


if __name__ == "__main__":
    main()
