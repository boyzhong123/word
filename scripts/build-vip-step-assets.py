#!/usr/bin/env python3
"""Build VIP membership learning-loop and path icons from ImageGen source art."""

import argparse
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets" / "vip"
VIP_DIR = PROJECT_ROOT / "images" / "vip"
EXPORT_SIZE = 520

LOOP_SOURCES = {
    "step-word.jpg": "vip-step-word-jelly-v2-source.png",
    "step-recite.jpg": "vip-step-recite-jelly-v2-source.png",
    "step-listen.jpg": "vip-step-listen-jelly-v2-source.png",
    "step-report.jpg": "vip-step-report-jelly-v2-source.png",
}

PATH_SOURCES = {
    "path-word.jpg": "vip-path-word-jelly-v2-source.png",
    "path-recite.jpg": "vip-path-recite-jelly-v2-source.png",
    "path-listen.jpg": "vip-path-listen-jelly-v2-source.png",
    "path-report.jpg": "vip-path-report-jelly-v2-source.png",
}

LOOP_DRAFT_SOURCES = {
    key: value.replace("-source.png", "-draft-source.png").replace(
        "vip-step-", "vip-step-"
    )
    for key, value in {
        "step-word.jpg": "vip-step-word-jelly-v2-draft-source.png",
        "step-recite.jpg": "vip-step-recite-jelly-v2-draft-source.png",
        "step-listen.jpg": "vip-step-listen-jelly-v2-draft-source.png",
        "step-report.jpg": "vip-step-report-jelly-v2-draft-source.png",
    }.items()
}


def export_jpg(source_path: Path, output_path: Path) -> None:
    image = Image.open(source_path).convert("RGB")
    if image.size != (EXPORT_SIZE, EXPORT_SIZE):
        image = image.resize((EXPORT_SIZE, EXPORT_SIZE), Image.Resampling.LANCZOS)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="JPEG", quality=88, optimize=True, progressive=True)
    print(f"built: {output_path} ({EXPORT_SIZE}x{EXPORT_SIZE})")


def build_mapping(mapping: dict[str, str], *, draft_suffix: str = "") -> None:
    for output_name, source_name in mapping.items():
        source_path = ASSETS_DIR / source_name
        if not source_path.exists():
            raise FileNotFoundError(f"missing source: {source_path}")
        stem = output_name.replace(".jpg", "")
        output_path = VIP_DIR / f"{stem}{draft_suffix}.jpg"
        export_jpg(source_path, output_path)


def promote_loop_from_draft() -> None:
    for output_name, draft_name in LOOP_DRAFT_SOURCES.items():
        draft_source = ASSETS_DIR / draft_name
        if not draft_source.exists():
            continue
        final_source = ASSETS_DIR / draft_name.replace("-draft-", "-")
        final_source.write_bytes(draft_source.read_bytes())
    build_mapping(LOOP_SOURCES)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--loop", action="store_true", help="build loop step icons only")
    parser.add_argument("--path", action="store_true", help="build path step icons only")
    parser.add_argument("--all", action="store_true", help="build all eight icons")
    parser.add_argument("--draft", action="store_true", help="build loop drafts only")
    parser.add_argument("--promote", action="store_true", help="promote loop drafts to production")
    args = parser.parse_args()

    if args.promote:
        promote_loop_from_draft()
        return

    if args.draft:
        build_mapping(LOOP_DRAFT_SOURCES, draft_suffix="-jelly-v2-draft")
        return

    build_loop = args.loop or args.all or not (args.path or args.loop or args.all)
    build_path = args.path or args.all

    if build_loop:
        build_mapping(LOOP_SOURCES)
    if build_path:
        build_mapping(PATH_SOURCES)


if __name__ == "__main__":
    main()
