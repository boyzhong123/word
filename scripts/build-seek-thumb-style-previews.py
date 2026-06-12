#!/usr/bin/env python3
"""Build static seek-thumb preview PNGs from ImageGen source sheets."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BUILD_SCRIPT = PROJECT_ROOT / "scripts" / "build-seek-thumb-sprite.py"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "images" / "listen" / "seek-thumb-styles"

STYLE_SOURCES = [
    ("jelly-v6-with-bar", "assets/seek-thumb-jelly-v6-source.png", 0, 0),
    ("jelly-v7-glasses", "assets/seek-thumb-jelly-v7-source.png", 0, 0),
    ("jelly-v8-glasses", "assets/seek-thumb-jelly-v8-source.png", 0, 0),
    ("jelly-v9-glasses", "assets/seek-thumb-jelly-v9-source.png", 0, 0),
]


def discover_generated_sources() -> list[tuple[str, str, int, int]]:
    entries = []
    for path in sorted((PROJECT_ROOT / "assets").glob("seek-thumb-style-*-source.png")):
        name = path.stem.replace("-source", "")
        entries.append((name, str(path.relative_to(PROJECT_ROOT)), 0, 0))
    return entries


def build_preview(source: Path, output: Path, frame_row: int, frame_col: int, width: int) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            sys.executable,
            str(BUILD_SCRIPT),
            str(source),
            str(output),
            "--static",
            "--frame-row",
            str(frame_row),
            "--frame-col",
            str(frame_col),
            "--width",
            str(width),
        ],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory for preview PNGs",
    )
    parser.add_argument("--width", type=int, default=320, help="Output width in pixels")
    parser.add_argument(
        "--source",
        type=Path,
        action="append",
        help="Optional extra source: name=path/to/source.png",
    )
    args = parser.parse_args()

    entries = list(STYLE_SOURCES) + discover_generated_sources()
    for item in args.source or []:
        name, _, path = item.partition("=")
        if not path:
            raise SystemExit(f"Invalid --source entry (expected name=path): {item}")
        entries.append((name, path, 0, 0))

    for name, rel_path, row, col in entries:
        source = PROJECT_ROOT / rel_path
        if not source.exists():
            print(f"skip missing source: {source}", file=sys.stderr)
            continue
        output = args.out_dir / f"{name}.png"
        build_preview(source, output, row, col, args.width)
        print(f"wrote {output.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
