"""Shared helpers for guide mascot / gesture icon builds."""

import subprocess
import sys
from pathlib import Path

from PIL import Image

CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"
SCALE_FACTOR = 0.86


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def fit_asset(image, width, height, padding):
    box = content_bbox(image)
    if box is None:
        raise ValueError("source image has no visible content")

    content = image.crop(box)
    inner_w = width - padding * 2
    inner_h = height - padding * 2
    scale = min(inner_w / content.width, inner_h / content.height) * SCALE_FACTOR
    target_w = max(1, round(content.width * scale))
    target_h = max(1, round(content.height * scale))
    content = content.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - target_w) // 2
    y = (height - target_h) // 2
    canvas.alpha_composite(content, (x, y))
    return canvas


def remove_chroma(source_path, work_dir):
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

    image = Image.open(source_path).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if r > 200 and g < 80 and b > 200:
                pixels[x, y] = (r, g, b, 0)
    return image
