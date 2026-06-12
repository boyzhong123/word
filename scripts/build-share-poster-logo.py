#!/usr/bin/env python3
"""Build check-in share poster logo from the canonical app icon source.

Prefer `scripts/build-app-logo-assets.py` to refresh all in-app logo assets together.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = PROJECT_ROOT / "assets" / "app-logo-source.png"
DEFAULT_OUTPUT = PROJECT_ROOT / "images" / "checkin" / "share-poster-logo.png"
TARGET_SIZE = 256


def _load_builder():
    module_path = Path(__file__).resolve().parent / "build-app-logo-assets.py"
    spec = importlib.util.spec_from_file_location("build_app_logo_assets", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def build_logo(source: Path, output: Path, size: int = TARGET_SIZE) -> None:
    builder = _load_builder()
    square = builder._prepare_square(builder.Image.open(source))
    logo = builder._build_logo(square, size, with_stroke=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    logo.save(output, optimize=True)
    print(f"source={source.name} -> {output} {logo.size} stroke")


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT
    size = int(sys.argv[3]) if len(sys.argv) > 3 else TARGET_SIZE
    if not source.exists():
        raise SystemExit(f"source not found: {source}")
    build_logo(source, output, size=size)


if __name__ == "__main__":
    main()
