#!/usr/bin/env python3
"""Build check-in calendar jelly icons from ImageGen source art."""

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHECKIN_DIR = PROJECT_ROOT / "images" / "checkin"
ASSETS_DIR = PROJECT_ROOT / "assets"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

CHARGE_ICON_SIZE = 96
GIFT_ICON_SIZE = 104
BOLT_HERO_WIDTH = 300
BOLT_HERO_HEIGHT = 340
GIFT_DAY_SIZE = 144

SOURCE_FILES = {
    "bolt-jelly.png": ("bolt-jelly-green-source.png", BOLT_HERO_WIDTH, BOLT_HERO_HEIGHT, 16, "green", "bolt"),
    "gift-jelly.png": ("gift-jelly-green-source.png", GIFT_ICON_SIZE, GIFT_ICON_SIZE, 6, "green", "gift"),
    "charge-jelly.png": ("charge-jelly-green-source.png", CHARGE_ICON_SIZE, CHARGE_ICON_SIZE, 8, "green", "charge"),
    "gift-day-jelly.png": ("gift-jelly-green-source.png", GIFT_DAY_SIZE, GIFT_DAY_SIZE, 8, "green", "gift"),
}

FILL_COLORS = {
    "bolt": (255, 196, 46, 255),
    "charge": (196, 181, 253, 255),
    "gift": (255, 154, 60, 255),
}

CHROMA_PROFILES = {
    "magenta": ["--key-color", "#f000d8", "--tolerance", "40", "--soft-matte", "--despill"],
    "magenta-soft": ["--key-color", "#f000d8", "--tolerance", "28", "--soft-matte"],
    "green": ["--key-color", "#00ff00", "--tolerance", "45", "--soft-matte"],
}


def chroma_key(source_path, work_dir, profile="magenta"):
    keyed_path = work_dir / f"{source_path.stem}-{profile}-keyed.png"
    if CHROMA_KEY_SCRIPT.exists():
        args = [
            sys.executable,
            str(CHROMA_KEY_SCRIPT),
            "--input",
            str(source_path),
            "--out",
            str(keyed_path),
            "--force",
        ] + CHROMA_PROFILES.get(profile, CHROMA_PROFILES["magenta"])
        subprocess.run(args, check=True)
        return Image.open(keyed_path).convert("RGBA")

    image = Image.open(source_path).convert("RGBA")
    return image


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def solidify_jelly(image, fill_color, dilate_radius=11):
    """Fill hollow jelly icons so the center is opaque, not see-through."""
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > 18 else 0)
    for _ in range(max(1, dilate_radius // 2)):
        mask = mask.filter(ImageFilter.MaxFilter(3))

    fill = Image.new("RGBA", rgba.size, fill_color)
    solid = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    solid.paste(fill, mask=mask)
    solid.alpha_composite(rgba)

    boosted_alpha = solid.getchannel("A").point(
        lambda value: 255 if value > 48 else max(value, 0)
    )
    solid.putalpha(boosted_alpha)
    return solid


def fit_asset(image, width, height, padding):
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
    return canvas


def resolve_source(name):
    candidates = [
        CHECKIN_DIR / name,
        ASSETS_DIR / name,
        PROJECT_ROOT / "assets" / name,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"missing source asset: {name}")


def main():
    work_dir = CHECKIN_DIR / ".jelly-build"
    work_dir.mkdir(parents=True, exist_ok=True)
    CHECKIN_DIR.mkdir(parents=True, exist_ok=True)

    for output_name, (source_name, width, height, padding, profile, kind) in SOURCE_FILES.items():
        source_path = resolve_source(source_name)
        keyed = chroma_key(source_path, work_dir, profile)
        keyed = solidify_jelly(keyed, FILL_COLORS[kind])
        icon = fit_asset(keyed, width, height, padding)
        icon.save(CHECKIN_DIR / output_name, optimize=True)
        print(f"built {CHECKIN_DIR / output_name}")


if __name__ == "__main__":
    main()
