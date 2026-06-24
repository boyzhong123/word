#!/usr/bin/env python3
"""Build today-route header path icon from source art."""

from pathlib import Path

from guide_asset_utils import fit_asset, remove_chroma

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HOME_DIR = PROJECT_ROOT / "images" / "home"

SOURCE_NAME = "icon-today-route-jelly-source.png"
OUTPUT_NAME = "icon-today-route-jelly.png"
ICON_SIZE = 72
PADDING = 6


def main():
    source_path = ASSETS_DIR / SOURCE_NAME
    if not source_path.exists():
        raise FileNotFoundError(f"missing source asset: {source_path}")

    work_dir = HOME_DIR / ".jelly-build"
    work_dir.mkdir(parents=True, exist_ok=True)
    HOME_DIR.mkdir(parents=True, exist_ok=True)

    keyed = remove_chroma(source_path, work_dir)
    icon = fit_asset(keyed, ICON_SIZE, ICON_SIZE, PADDING)
    out_path = HOME_DIR / OUTPUT_NAME
    icon.save(out_path, optimize=True)
    print(f"built {out_path} ({ICON_SIZE}x{ICON_SIZE})")


if __name__ == "__main__":
    main()
