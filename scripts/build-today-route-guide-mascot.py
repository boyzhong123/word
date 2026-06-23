#!/usr/bin/env python3
"""Build today-route guide coach mascot from generated source art."""

from pathlib import Path

from guide_asset_utils import fit_asset, remove_chroma

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HOME_DIR = PROJECT_ROOT / "images" / "home"

OUTPUT_NAME = "today-route-guide-mascot.png"
SOURCE_NAME = "today-route-guide-mascot-source.png"
WIDTH = 320
HEIGHT = 320
PADDING = 36


def main():
    source_path = ASSETS_DIR / SOURCE_NAME
    if not source_path.exists():
        raise FileNotFoundError(f"missing source asset: {source_path}")

    work_dir = HOME_DIR / ".build"
    work_dir.mkdir(parents=True, exist_ok=True)
    HOME_DIR.mkdir(parents=True, exist_ok=True)

    image = remove_chroma(source_path, work_dir)
    icon = fit_asset(image, WIDTH, HEIGHT, PADDING)
    out_path = HOME_DIR / OUTPUT_NAME
    icon.save(out_path, optimize=True)
    print(f"built {out_path}")


if __name__ == "__main__":
    main()
