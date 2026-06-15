#!/usr/bin/env python3
"""Build home exam entry banner PNGs: trim outer whitespace, then resize."""

from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HOME_DIR = PROJECT_ROOT / "images" / "home"

# Home exam cards render at 692rpx wide; export @2x width and keep trimmed aspect ratio.
BANNER_WIDTH = 1384
PAGE_BG = (255, 253, 248)

SOURCE_FILES = {
    "exam-entry-banner-entry.png": "exam-entry-banner-entry-source.png",
    "exam-entry-banner-exit.png": "exam-entry-banner-exit-source.png",
    "exam-entry-banner-exit-locked.png": "exam-entry-banner-exit-locked-source.png",
}


def _is_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 16:
        return True
    if abs(r - PAGE_BG[0]) <= 12 and abs(g - PAGE_BG[1]) <= 12 and abs(b - PAGE_BG[2]) <= 12:
        return True
    if min(r, g, b) > 238 and max(r, g, b) - min(r, g, b) < 12:
        return True
    return False


def trim_outer_margins(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()

    def column_has_content(x: int) -> bool:
        for y in range(height):
            r, g, b, a = pixels[x, y]
            if not _is_background_pixel(r, g, b, a):
                return True
        return False

    def row_has_content(y: int) -> bool:
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if not _is_background_pixel(r, g, b, a):
                return True
        return False

    left = next((x for x in range(width) if column_has_content(x)), 0)
    right = next((x for x in range(width - 1, -1, -1) if column_has_content(x)), width - 1)
    top = next((y for y in range(height) if row_has_content(y)), 0)
    bottom = next((y for y in range(height - 1, -1, -1) if row_has_content(y)), height - 1)

    if left >= right or top >= bottom:
        return rgba

    pad = 1
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(width - 1, right + pad)
    bottom = min(height - 1, bottom + pad)
    return rgba.crop((left, top, right + 1, bottom + 1))


def resize_to_width(image: Image.Image, width: int) -> Image.Image:
    src_w, src_h = image.size
    height = max(1, round(width * src_h / src_w))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def build_banner(source_path: Path, width: int) -> Image.Image:
    image = Image.open(source_path)
    trimmed = trim_outer_margins(image)
    return resize_to_width(trimmed, width)


def main() -> None:
    HOME_DIR.mkdir(parents=True, exist_ok=True)
    for out_name, source_name in SOURCE_FILES.items():
        source_path = ASSETS_DIR / source_name
        if not source_path.exists():
            raise FileNotFoundError(f"missing source asset: {source_path}")
        banner = build_banner(source_path, BANNER_WIDTH)
        out_path = HOME_DIR / out_name
        banner.save(out_path, optimize=True)
        print(f"Wrote {out_path} ({banner.width}x{banner.height})")


if __name__ == "__main__":
    main()
