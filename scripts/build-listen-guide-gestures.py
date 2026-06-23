#!/usr/bin/env python3
"""Build listen-page guide gesture icons from generated source art."""

from pathlib import Path

from guide_asset_utils import fit_asset, remove_chroma

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
LISTEN_DIR = PROJECT_ROOT / "images" / "listen"

ASSETS = (
    ("listen-guide-tap-finger-source.png", "listen-guide-tap-finger.png", 256, 36),
    ("listen-guide-swipe-hand-source.png", "listen-guide-swipe-hand.png", 256, 32),
    ("listen-guide-swipe-chevrons-white-source.png", "listen-guide-swipe-chevrons-white.png", 256, 36),
)


def main():
    work_dir = LISTEN_DIR / ".build"
    work_dir.mkdir(parents=True, exist_ok=True)
    LISTEN_DIR.mkdir(parents=True, exist_ok=True)

    for source_name, output_name, width, padding in ASSETS:
        source_path = ASSETS_DIR / source_name
        if not source_path.exists():
            raise FileNotFoundError(f"missing source asset: {source_path}")
        image = remove_chroma(source_path, work_dir)
        icon = fit_asset(image, width, width, padding)
        out_path = LISTEN_DIR / output_name
        icon.save(out_path, optimize=True)
        print(f"built {out_path}")


if __name__ == "__main__":
    main()
