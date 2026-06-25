#!/usr/bin/env python3
"""Build membership records empty-state art from ImageGen source."""

import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from guide_asset_utils import content_bbox, remove_chroma

ASSETS_DIR = PROJECT_ROOT / "assets"
VIP_DIR = PROJECT_ROOT / "images" / "vip"
VERCEL_DIR = PROJECT_ROOT / "vercel-assets" / "images" / "vip"

SOURCE_CANDIDATES = (
    "membership-records-empty-v4-source.png",
    "membership-records-empty-v3-source.png",
    "membership-records-empty-v2-source.png",
    "membership-records-empty-v1-source.png",
)
OUTPUT_NAME = "membership-records-empty.png"
WIDTH = 320
HEIGHT = 400
PADDING = 16


def resolve_source():
    for name in SOURCE_CANDIDATES:
        path = ASSETS_DIR / name
        if path.exists():
            return path
    raise FileNotFoundError(f"missing source asset in {ASSETS_DIR}")


def to_empty_grey(image):
    rgba = image.convert("RGBA")
    r, g, b, a = rgba.split()
    gray = Image.merge("RGB", (r, g, b)).convert("L")
    gray = ImageEnhance.Brightness(gray).enhance(1.02)
    gray = ImageEnhance.Contrast(gray).enhance(0.94)
    muted = Image.merge("RGBA", (gray, gray, gray, a))
    muted = ImageEnhance.Color(muted).enhance(0.0)
    return muted.filter(ImageFilter.UnsharpMask(radius=0.8, percent=70, threshold=3))


def fit_asset(image, width, height):
    box = content_bbox(image)
    if box is None:
        raise ValueError("source image has no visible content")
    content = image.crop(box)
    content = to_empty_grey(content)
    inner_w = width - PADDING * 2
    inner_h = height - PADDING * 2
    scale = min(inner_w / content.width, inner_h / content.height)
    target_w = max(1, round(content.width * scale))
    target_h = max(1, round(content.height * scale))
    content = content.resize((target_w, target_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - target_w) // 2
    y = (height - target_h) // 2
    canvas.alpha_composite(content, (x, y))
    return canvas


def main():
    source_path = resolve_source()
    work_dir = VIP_DIR / ".build"
    work_dir.mkdir(parents=True, exist_ok=True)
    keyed = remove_chroma(source_path, work_dir)
    built = fit_asset(keyed, WIDTH, HEIGHT)
    VIP_DIR.mkdir(parents=True, exist_ok=True)
    VERCEL_DIR.mkdir(parents=True, exist_ok=True)
    out_home = VIP_DIR / OUTPUT_NAME
    out_vercel = VERCEL_DIR / OUTPUT_NAME
    built.save(out_home, optimize=True)
    built.save(out_vercel, optimize=True)
    print(f"built {out_home} from {source_path.name}")


if __name__ == "__main__":
    main()
