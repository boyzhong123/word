#!/usr/bin/env python3
"""Build advertisement page jelly icons from ImageGen source art."""

import subprocess
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
AD_DIR = PROJECT_ROOT / "images" / "home" / "ad"
ASSETS_DIR = PROJECT_ROOT / "assets"
WORK_DIR = AD_DIR / ".jelly-build"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

SOURCE_FILES = {
    "icon-press-jelly.png": ("ad-icon-press-jelly-source.png", 64, 8),
    "icon-word-jelly.png": ("ad-icon-word-flat-source.png", 96, 10),
    "icon-proverb-jelly.png": ("ad-icon-proverb-flat-source.png", 96, 10),
    "icon-review-jelly.png": ("ad-icon-review-flat-source.png", 96, 10),
    "icon-read-jelly.png": ("ad-icon-read-jelly-source.png", 96, 10),
    "package-full-jelly.png": ("ad-package-full-jelly-source.png", 120, 10),
    "package-book-jelly.png": ("ad-package-book-jelly-source.png", 120, 10),
    "strategy-jelly.png": ("ad-strategy-jelly-source.png", 640, 24, 320),
    "step-learn-jelly.png": ("ad-step-learn-jelly-source.png", 80, 8),
    "step-read-jelly.png": ("ad-step-read-jelly-source.png", 80, 8),
    "step-quiz-jelly.png": ("ad-step-quiz-jelly-source.png", 80, 8),
    "step-review-jelly.png": ("ad-step-review-jelly-source.png", 80, 8),
}

CHROMA_ARGS = [
    "--auto-key", "border",
    "--soft-matte",
    "--transparent-threshold", "12",
    "--opaque-threshold", "220",
    "--despill",
]


def resolve_source(name):
    for candidate in (ASSETS_DIR / name, PROJECT_ROOT / "assets" / name):
        if candidate.exists():
            return candidate
    cursor_assets = Path.home() / ".cursor/projects/Users-zhong-Downloads-proverbs/assets" / name
    if cursor_assets.exists():
        return cursor_assets
    raise FileNotFoundError(f"missing source asset: {name}")


def chroma_key(source_path, work_dir):
    keyed_path = work_dir / f"{source_path.stem}-keyed.png"
    if CHROMA_KEY_SCRIPT.exists():
        args = [
            sys.executable,
            str(CHROMA_KEY_SCRIPT),
            "--input",
            str(source_path),
            "--out",
            str(keyed_path),
            "--force",
        ] + CHROMA_ARGS
        subprocess.run(args, check=True)
        return Image.open(keyed_path).convert("RGBA")
    return Image.open(source_path).convert("RGBA")


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def fit_asset(image, width, height, padding):
    box = content_bbox(image)
    if box is None:
        raise ValueError(f"no visible content in {width}x{height}")
    content = image.crop(box)
    inner_w = width - padding * 2
    inner_h = height - padding * 2
    scale = min(inner_w / content.width, inner_h / content.height)
    target_w = max(1, round(content.width * scale))
    target_h = max(1, round(content.height * scale))
    content = content.resize((target_w, target_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.alpha_composite(content, ((width - target_w) // 2, (height - target_h) // 2))
    return canvas


def main():
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--only",
        nargs="+",
        metavar="OUTPUT",
        help="build only these output filenames (e.g. icon-word-jelly.png)",
    )
    args = parser.parse_args()

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    AD_DIR.mkdir(parents=True, exist_ok=True)

    targets = SOURCE_FILES
    if args.only:
        missing = [name for name in args.only if name not in SOURCE_FILES]
        if missing:
            raise SystemExit(f"unknown outputs: {', '.join(missing)}")
        targets = {name: SOURCE_FILES[name] for name in args.only}

    for output_name, spec in targets.items():
        source_name = spec[0]
        if len(spec) == 4:
            width, height, padding = spec[1], spec[2], spec[3]
        else:
            width, height, padding = spec[1], spec[1], spec[2]
        source_path = resolve_source(source_name)
        keyed = chroma_key(source_path, WORK_DIR)
        icon = fit_asset(keyed, width, height, padding)
        icon.save(AD_DIR / output_name, optimize=True)
        print(f"built {AD_DIR / output_name}")


if __name__ == "__main__":
    main()
