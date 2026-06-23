#!/usr/bin/env python3
"""Build inline VIP name badge from generated source art."""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

from guide_asset_utils import content_bbox, remove_chroma

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HOME_DIR = PROJECT_ROOT / "images" / "home"
VERCEL_DIR = PROJECT_ROOT / "vercel-assets" / "images" / "home"

SOURCE_ACTIVE_CANDIDATES = (
    "vip-name-badge-source.png",
)
SOURCE_INACTIVE_CANDIDATES = (
    "vip-name-badge-inactive-source.png",
)
OUTPUT_ACTIVE = "vip-name-badge.png"
OUTPUT_INACTIVE = "vip-name-badge-inactive.png"
OUTPUT_WIDTH = 168
OUTPUT_HEIGHT = 66
PADDING = 2


def fit_badge(image, width, height, padding):
    box = content_bbox(image)
    if box is None:
        raise ValueError("source image has no visible content")

    content = image.crop(box)
    inner_w = width - padding * 2
    inner_h = height - padding * 2
    scale = min(inner_w / content.width, inner_h / content.height)
    target_w = max(1, round(content.width * scale))
    target_h = max(1, round(content.height * scale))
    content = content.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - target_w) // 2
    y = (height - target_h) // 2
    canvas.alpha_composite(content, (x, y))
    canvas = ImageEnhance.Contrast(canvas).enhance(1.06)
    canvas = ImageEnhance.Color(canvas).enhance(1.04)
    return canvas.filter(ImageFilter.UnsharpMask(radius=1.0, percent=95, threshold=2))


def resolve_source(candidates):
    for name in candidates:
        path = ASSETS_DIR / name
        if path.exists():
            return path
    raise FileNotFoundError(f"missing source asset in {ASSETS_DIR}: {candidates}")


def build_one(source_path, output_name, work_dir):
    keyed = remove_chroma(source_path, work_dir)
    built = fit_badge(keyed, OUTPUT_WIDTH, OUTPUT_HEIGHT, PADDING)
    out_home = HOME_DIR / output_name
    out_vercel = VERCEL_DIR / output_name
    built.save(out_home, optimize=True)
    built.save(out_vercel, optimize=True)
    print(f"built {out_home} ({OUTPUT_WIDTH}x{OUTPUT_HEIGHT})")


def build_inactive_from_active(active_path):
    image = Image.open(active_path).convert("RGBA")
    r, g, b, a = image.split()
    gray = Image.merge("RGB", (r, g, b)).convert("L")
    gray = ImageEnhance.Brightness(gray).enhance(1.08)
    gray = ImageEnhance.Contrast(gray).enhance(0.92)
    inactive = Image.merge("RGBA", (gray, gray, gray, a))
    inactive = ImageEnhance.Color(inactive).enhance(0.0)
    inactive = ImageEnhance.Contrast(inactive).enhance(1.02)
    return inactive.filter(ImageFilter.UnsharpMask(radius=0.9, percent=80, threshold=2))


def main():
    work_dir = HOME_DIR / ".build"
    work_dir.mkdir(parents=True, exist_ok=True)
    HOME_DIR.mkdir(parents=True, exist_ok=True)
    VERCEL_DIR.mkdir(parents=True, exist_ok=True)

    build_one(resolve_source(SOURCE_ACTIVE_CANDIDATES), OUTPUT_ACTIVE, work_dir)
    active_home = HOME_DIR / OUTPUT_ACTIVE
    if any((ASSETS_DIR / name).exists() for name in SOURCE_INACTIVE_CANDIDATES):
        build_one(resolve_source(SOURCE_INACTIVE_CANDIDATES), OUTPUT_INACTIVE, work_dir)
    elif active_home.exists():
        inactive = build_inactive_from_active(active_home)
        out_home = HOME_DIR / OUTPUT_INACTIVE
        out_vercel = VERCEL_DIR / OUTPUT_INACTIVE
        inactive.save(out_home, optimize=True)
        inactive.save(out_vercel, optimize=True)
        print(f"built {out_home} from active greyscale fallback")


if __name__ == "__main__":
    main()
