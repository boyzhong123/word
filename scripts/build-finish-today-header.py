#!/usr/bin/env python3
"""Export finish/today header banners from ImageGen source art in assets/."""

from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
OUT_DIR = PROJECT_ROOT / "images" / "finish"
EXPORT_WIDTH = 750

# Sources live in assets/ only. Runtime banners are lossless PNGs in images/finish/.
SOURCE_FILES = {
    "finish-today-header-1star.png": "finish-today-header-1star-source.png",
    "finish-today-header-2star.png": "finish-today-header-2star-source.png",
    "finish-today-header-3star.png": "finish-today-header-3star-source.png",
}


def export_banner(source_path: Path, output_path: Path) -> None:
    image = Image.open(source_path).convert("RGBA")
    scale = EXPORT_WIDTH / image.width
    target_h = round(image.height * scale)
    banner = image.resize((EXPORT_WIDTH, target_h), Image.Resampling.LANCZOS)
    banner.save(output_path, optimize=True)
    print(f"built {output_path} ({EXPORT_WIDTH}x{target_h}) from {source_path.name}")


def cleanup_stale_outputs() -> None:
    """Remove legacy JPEG exports from the package-size optimization pass."""
    for pattern in (
        "finish-today-header.jpg",
        "finish-today-header-1star.jpg",
        "finish-today-header-2star.jpg",
        "finish-today-header-3star.jpg",
        "*-source.png",
    ):
        for path in OUT_DIR.glob(pattern):
            path.unlink()
            print(f"removed stale {path.name}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for output_name, source_name in SOURCE_FILES.items():
        source_path = ASSETS_DIR / source_name
        if not source_path.exists():
            raise FileNotFoundError(f"missing ImageGen source: {source_path}")
        export_banner(source_path, OUT_DIR / output_name)

    cleanup_stale_outputs()


if __name__ == "__main__":
    main()
