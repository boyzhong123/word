#!/usr/bin/env python3
"""Build exam-report badge icons from ImageGen source art or programmatic fallback."""

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = PROJECT_ROOT / "images" / "home" / "exam-report"
ASSETS_DIR = PROJECT_ROOT / "assets"
WORK_DIR = OUT_DIR / ".build"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

BADGE_SIZE = 132
FONT_PATH = Path("/System/Library/Fonts/STHeiti Medium.ttc")

SOURCE_FILES = {
    "icon-badge-word.png": ("exam-report-badge-word-source.png", "词", "#16a34a", "#15803d"),
    "icon-badge-sentence.png": ("exam-report-badge-sentence-source.png", "句", "#f97316", "#ea580c"),
}

CHROMA_ARGS = [
    "--key-color",
    "#ff00ff",
    "--tolerance",
    "40",
    "--soft-matte",
]


def resolve_source(name):
    for candidate in (ASSETS_DIR / name, PROJECT_ROOT / "assets" / name):
        if candidate.exists():
            return candidate
    cursor_assets = Path.home() / ".cursor/projects/Users-zhong-Downloads-proverbs/assets" / name
    if cursor_assets.exists():
        return cursor_assets
    return None


def chroma_key(source_path, work_dir):
    keyed_path = work_dir / f"{source_path.stem}-keyed.png"
    if CHROMA_KEY_SCRIPT.exists():
        subprocess.run(
            [
                sys.executable,
                str(CHROMA_KEY_SCRIPT),
                "--input",
                str(source_path),
                "--out",
                str(keyed_path),
                "--force",
            ]
            + CHROMA_ARGS,
            check=True,
        )
        return Image.open(keyed_path).convert("RGBA")
    return Image.open(source_path).convert("RGBA")


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def fit_icon(image, size, padding=6):
    box = content_bbox(image)
    if box is None:
        raise ValueError(f"no visible content in {size}x{size}")
    content = image.crop(box)
    inner = size - padding * 2
    scale = min(inner / content.width, inner / content.height)
    width = max(1, round(content.width * scale))
    height = max(1, round(content.height * scale))
    content = content.resize((width, height), Image.Resampling.LANCZOS)
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - width) // 2
    y = (size - height) // 2
    icon.alpha_composite(content, (x, y))
    return icon


def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def draw_badge(char, fill, stroke, size=BADGE_SIZE):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 132
    radius = round(13 * s * 3)
    pad = round(8 * s)
    box = (pad, pad, size - pad, size - pad)

    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_box = (box[0], box[1] + round(6 * s), box[2], box[3] + round(6 * s))
    shadow_draw.rounded_rectangle(shadow_box, radius=radius, fill=(0, 0, 0, 38))
    img = Image.alpha_composite(shadow, img)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(box, radius=radius, fill=hex_rgb(fill), outline=hex_rgb(stroke), width=max(1, round(2 * s)))

    font_size = round(52 * s)
    font = ImageFont.truetype(str(FONT_PATH), font_size)
    bbox = draw.textbbox((0, 0), char, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 - bbox[0]
    y = (size - text_h) / 2 - bbox[1] - round(2 * s)
    draw.text((x, y), char, font=font, fill=(255, 255, 255, 255))
    return img


def build_from_source(output_name, source_name):
    source_path = resolve_source(source_name)
    if source_path is None:
        return False
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    keyed = chroma_key(source_path, WORK_DIR)
    icon = fit_icon(keyed, BADGE_SIZE, padding=4)
    icon.save(OUT_DIR / output_name, optimize=True)
    print(f"built {OUT_DIR / output_name} from {source_path.name}")
    return True


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for output_name, (source_name, char, fill, stroke) in SOURCE_FILES.items():
        if build_from_source(output_name, source_name):
            continue
        icon = draw_badge(char, fill, stroke)
        icon.save(OUT_DIR / output_name, optimize=True)
        print(f"built {OUT_DIR / output_name} (programmatic fallback)")


if __name__ == "__main__":
    main()
