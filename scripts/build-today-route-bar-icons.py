#!/usr/bin/env python3
"""Build today-route progress bar whistle and finish-flag icons."""

from pathlib import Path

from guide_asset_utils import fit_asset, remove_chroma

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HOME_DIR = PROJECT_ROOT / "images" / "home"

ICON_SIZE = 64
PADDING = 8

BUILD_TARGETS = (
    ("today-route-bar-whistle-source.png", "icon-today-route-bar-whistle-jelly.png"),
    ("today-route-bar-flag-source.png", "icon-today-route-bar-flag-jelly.png"),
)


def main():
    work_dir = HOME_DIR / ".build"
    work_dir.mkdir(parents=True, exist_ok=True)
    HOME_DIR.mkdir(parents=True, exist_ok=True)

    for source_name, output_name in BUILD_TARGETS:
        source_path = ASSETS_DIR / source_name
        if not source_path.exists():
            raise FileNotFoundError(f"missing source asset: {source_path}")

        image = remove_chroma(source_path, work_dir)
        icon = fit_asset(image, ICON_SIZE, ICON_SIZE, PADDING)
        out_path = HOME_DIR / output_name
        icon.save(out_path, optimize=True)
        print(f"built {out_path}")


if __name__ == "__main__":
    main()
