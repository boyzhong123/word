#!/usr/bin/env python3
"""Build VIP purchase-card art from ImageGen source."""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HOME_DIR = PROJECT_ROOT / "images" / "home"
VERCEL_DIR = PROJECT_ROOT / "vercel-assets" / "images" / "home"

SOURCE_CANDIDATES = (
    "vip-floating-unlock-v4-source.png",
    "vip-floating-unlock-v3-draft.png",
    "vip-floating-unlock-v2-draft.png",
)
OUTPUT_NAME = "vip-floating-unlock.png"
WIDTH = 720
HEIGHT = 960


def resolve_source():
    for name in SOURCE_CANDIDATES:
        path = ASSETS_DIR / name
        if path.exists():
            return path
    raise FileNotFoundError(f"missing source asset in {ASSETS_DIR}")


def content_bbox(image):
    rgb = image.convert("RGB")
    pixels = rgb.load()
    width, height = rgb.size
    min_x, min_y = width, height
    max_x, max_y = -1, -1
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if r > 24 or g > 24 or b > 24:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < min_x or max_y < min_y:
        return None
    pad = max(8, round(min(width, height) * 0.02))
    return (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(width, max_x + pad + 1),
        min(height, max_y + pad + 1),
    )


def fit_asset(image, width, height):
    box = content_bbox(image)
    if box is None:
        raise ValueError("source image has no visible content")
    content = image.crop(box)
    scale = min(width / content.width, height / content.height)
    target_w = max(1, round(content.width * scale))
    target_h = max(1, round(content.height * scale))
    content = content.resize((target_w, target_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (width, height), (24, 20, 18))
    x = (width - target_w) // 2
    y = (height - target_h) // 2
    if content.mode == "RGBA":
        canvas.paste(content, (x, y), content)
    else:
        canvas.paste(content, (x, y))
    canvas = ImageEnhance.Contrast(canvas).enhance(1.04)
    canvas = ImageEnhance.Color(canvas).enhance(1.05)
    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=3))
    return canvas


def main():
    source_path = resolve_source()
    image = Image.open(source_path).convert("RGBA")
    built = fit_asset(image, WIDTH, HEIGHT)
    HOME_DIR.mkdir(parents=True, exist_ok=True)
    VERCEL_DIR.mkdir(parents=True, exist_ok=True)
    out_home = HOME_DIR / OUTPUT_NAME
    out_vercel = VERCEL_DIR / OUTPUT_NAME
    built.save(out_home, optimize=True, quality=92)
    built.save(out_vercel, optimize=True, quality=92)
    print(f"built {out_home} from {source_path.name}")


if __name__ == "__main__":
    main()
