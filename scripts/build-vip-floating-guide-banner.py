#!/usr/bin/env python3
"""Build VIP floating guide banner from ImageGen source art.

The today page renders the banner with mode=widthFix, so we only trim empty
margins and resize proportionally — never crop or stretch to a fixed ratio.
"""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HOME_DIR = PROJECT_ROOT / "images" / "home"
VERCEL_DIR = PROJECT_ROOT / "vercel-assets" / "images" / "home"

SOURCE_CANDIDATES = (
    "vip-floating-guide-banner-source.png",
    "vip-floating-guide-banner-regen-v7-source.png",
)
OUTPUT_NAME = "vip-floating-guide-banner.png"
OUTPUT_MAX_WIDTH = 1788


def resolve_source():
    for name in SOURCE_CANDIDATES:
        path = ASSETS_DIR / name
        if path.exists():
            return path
    raise FileNotFoundError(f"missing source asset in {ASSETS_DIR}")


def is_background_pixel(r, g, b):
    return r > 248 and g > 244 and b > 236


def content_bbox(image):
    rgb = image.convert("RGB")
    pixels = rgb.load()
    width, height = rgb.size
    min_x, min_y = width, height
    max_x, max_y = -1, -1
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if not is_background_pixel(r, g, b):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < min_x or max_y < min_y:
        return None
    pad = max(8, round(min(width, height) * 0.015))
    return (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(width, max_x + pad + 1),
        min(height, max_y + pad + 1),
    )


def build_banner(image, max_width):
    box = content_bbox(image)
    if box is None:
        raise ValueError("source image has no visible content")

    card = image.crop(box).convert("RGB")
    if card.width > max_width:
        scale = max_width / card.width
        target_w = max_width
        target_h = max(1, round(card.height * scale))
        card = card.resize((target_w, target_h), Image.Resampling.LANCZOS)

    card = ImageEnhance.Contrast(card).enhance(1.02)
    card = ImageEnhance.Color(card).enhance(1.01)
    return card.filter(ImageFilter.UnsharpMask(radius=0.8, percent=60, threshold=3))


def main():
    source_path = resolve_source()
    image = Image.open(source_path)
    built = build_banner(image, OUTPUT_MAX_WIDTH)

    HOME_DIR.mkdir(parents=True, exist_ok=True)
    VERCEL_DIR.mkdir(parents=True, exist_ok=True)
    out_home = HOME_DIR / OUTPUT_NAME
    out_vercel = VERCEL_DIR / OUTPUT_NAME
    built.save(out_home, optimize=True, quality=92)
    built.save(out_vercel, optimize=True, quality=92)
    print(
        f"built {out_home} ({built.width}x{built.height}, "
        f"aspect {built.width / built.height:.2f}:1, no crop)"
    )


if __name__ == "__main__":
    main()
