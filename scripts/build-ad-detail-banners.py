#!/usr/bin/env python3
"""Resize advertisement product-detail banners for mobile width."""

from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
OUT_DIR = PROJECT_ROOT / "images" / "home" / "ad"
CURSOR_ASSETS = Path.home() / ".cursor/projects/Users-zhong-Downloads-proverbs/assets"
TARGET_W = 750

SOURCES = {
    "detail-page.png": "detail-page-source.png",
}


def resolve_source(name):
    for candidate in (ASSETS_DIR / name, CURSOR_ASSETS / name):
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"missing source asset: {name}")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for out_name, src_name in SOURCES.items():
        src = resolve_source(src_name)
        img = Image.open(src).convert("RGB")
        scale = TARGET_W / img.width
        resized = img.resize((TARGET_W, max(1, round(img.height * scale))), Image.Resampling.LANCZOS)
        resized.save(OUT_DIR / out_name, format="PNG", optimize=True)
        print(f"built {OUT_DIR / out_name} {resized.size}")


if __name__ == "__main__":
    main()
