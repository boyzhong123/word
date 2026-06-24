#!/usr/bin/env python3
"""Composite canonical Today-page jelly onto onboarding intro hero banner."""

import subprocess
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
OUT_DIR = PROJECT_ROOT / "images" / "onboarding"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

BANNER_W = 1536
BANNER_H = 768
# Route guide mascot: same identity pipeline as toast-hint, open-palms welcome pose.
MASCOT_PATH = PROJECT_ROOT / "images" / "home" / "today-route-guide-mascot.png"
MASCOT_FALLBACK = ASSETS_DIR / "toast-hint-source.png"
BG_SOURCE = ASSETS_DIR / "onboard-intro-hero-bg-source.png"


def key_black(image: Image.Image, threshold: int = 28) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if r <= threshold and g <= threshold and b <= threshold:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def key_magenta(source_path: Path, work_dir: Path) -> Image.Image:
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
                "--key-color",
                "#ff00ff",
                "--tolerance",
                "40",
                "--force",
            ],
            check=True,
        )
        return Image.open(keyed_path).convert("RGBA")
    return key_black(Image.open(source_path))


def content_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def load_mascot(work_dir: Path) -> Image.Image:
    if MASCOT_PATH.exists():
        return key_black(Image.open(MASCOT_PATH))
    if MASCOT_FALLBACK.exists():
        return key_magenta(MASCOT_FALLBACK, work_dir)
    raise FileNotFoundError(f"missing mascot: {MASCOT_PATH} or {MASCOT_FALLBACK}")


def fit_banner(image: Image.Image) -> Image.Image:
    w, h = image.size
    target_ratio = BANNER_W / BANNER_H
    current_ratio = w / h
    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        image = image.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        top = max(0, h - new_h)
        image = image.crop((0, top, w, top + new_h))
    return image.resize((BANNER_W, BANNER_H), Image.Resampling.LANCZOS)


def composite(bg_path: Path, out_path: Path):
    work_dir = OUT_DIR / ".build"
    work_dir.mkdir(parents=True, exist_ok=True)

    banner = fit_banner(Image.open(bg_path).convert("RGBA"))
    mascot = load_mascot(work_dir)
    box = content_bbox(mascot)
    if box is None:
        raise ValueError("mascot has no visible pixels")
    mascot = mascot.crop(box)

    # Mascot height ~54% of banner; sit on bottom with slight left inset.
    target_h = int(BANNER_H * 0.54)
    scale = target_h / mascot.height
    target_w = max(1, round(mascot.width * scale))
    mascot = mascot.resize((target_w, target_h), Image.Resampling.LANCZOS)

    x = int(BANNER_W * 0.02)
    y = BANNER_H - target_h - int(BANNER_H * 0.04)
    banner.alpha_composite(mascot, (x, y))
    banner.save(out_path, optimize=True)
    print(f"built {out_path}")


def main():
    raw_bg = ASSETS_DIR / "onboard-intro-hero-bg-raw.png"
    source = BG_SOURCE if BG_SOURCE.exists() else raw_bg
    if not source.exists():
        raise FileNotFoundError(
            f"missing background source: {source}. Run generate-onboarding-intro-hero.sh first."
        )
    composite(source, OUT_DIR / "onboard-intro-hero.png")


if __name__ == "__main__":
    main()
