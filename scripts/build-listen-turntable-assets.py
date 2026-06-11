#!/usr/bin/env python3
"""Build listen-page turntable assets from imagegen green-screen sources."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops

PROJECT_ROOT = Path(__file__).resolve().parent.parent
LISTEN_DIR = PROJECT_ROOT / "images" / "listen"
ASSETS_DIR = PROJECT_ROOT / "assets"
CHROMA = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

CARD = 620
DISC = 520
DISC_OFFSET = (CARD - DISC) // 2
PIVOT_TARGET = (592, 36)


def chroma_key(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            sys.executable,
            str(CHROMA),
            "--input",
            str(src),
            "--out",
            str(dest),
            "--auto-key",
            "border",
            "--soft-matte",
            "--transparent-threshold",
            "12",
            "--opaque-threshold",
            "220",
            "--despill",
            "--force",
        ],
        check=True,
    )


def fit_square(img: Image.Image, size: int) -> Image.Image:
    w, h = img.size
    scale = size / max(w, h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    resized = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((size - nw) // 2, (size - nh) // 2))
    return canvas


def fit_disc(img: Image.Image, size: int) -> Image.Image:
    return fit_square(img, size)


def pivot_point(img: Image.Image) -> tuple[float, float]:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    best = None
    for y in range(h):
        for x in range(w):
            if px[x, y][3] < 180:
                continue
            score = x - y * 0.35
            if best is None or score > best[0]:
                best = (score, x, y)
    if best is None:
        return w * 0.88, h * 0.12
    return best[1], best[2]


def build_tonearm_overlay(src: Path, dest: Path) -> None:
    keyed = LISTEN_DIR / f"{dest.stem}-keyed.png"
    chroma_key(src, keyed)
    arm = Image.open(keyed).convert("RGBA")
    px, py = pivot_point(arm)
    target_scale = 0.72
    nw = max(1, round(arm.width * target_scale))
    nh = max(1, round(arm.height * target_scale))
    arm = arm.resize((nw, nh), Image.LANCZOS)
    px *= target_scale
    py *= target_scale

    canvas = Image.new("RGBA", (CARD, CARD), (0, 0, 0, 0))
    paste_x = round(PIVOT_TARGET[0] - px)
    paste_y = round(PIVOT_TARGET[1] - py)
    canvas.alpha_composite(arm, (paste_x, paste_y))
    canvas.save(dest)


def main() -> None:
    sources = {
        "player-card-base.png": "player-card-base-src.png",
        "disc-tray.png": "disc-tray-src.png",
        "disc-texture-overlay.png": "disc-texture-src.png",
    }
    for dest_name, src_name in sources.items():
        src = ASSETS_DIR / src_name
        keyed = LISTEN_DIR / f"{dest_name.replace('.png', '')}-keyed.png"
        out = LISTEN_DIR / dest_name
        chroma_key(src, keyed)
        img = Image.open(keyed).convert("RGBA")
        if dest_name == "player-card-base.png":
            img = fit_square(img, CARD)
        elif dest_name == "disc-tray.png":
            img = fit_disc(img, DISC)
        else:
            img = fit_disc(img, DISC)
        img.save(out)
        print(f"Wrote {out}")

    build_tonearm_overlay(ASSETS_DIR / "tonearm-playing-src.png", LISTEN_DIR / "tonearm-overlay-playing.png")
    build_tonearm_overlay(ASSETS_DIR / "tonearm-parked-src.png", LISTEN_DIR / "tonearm-overlay-parked.png")
    print("Wrote tonearm overlays")


if __name__ == "__main__":
    main()
