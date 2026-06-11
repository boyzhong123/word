#!/usr/bin/env python3
"""Split a PK sprite sheet into 7 normalized frames and build the home-page sprite."""

import subprocess
import sys
from pathlib import Path

from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCE_DEFAULT = PROJECT_ROOT / "images/home/map/monsters/student-monster-pk-7frames-source.png"
MONSTER_DIR = PROJECT_ROOT / "images/home/map/monsters"
HOME_DIR = PROJECT_ROOT / "images/home"
CHROMA_KEY_SCRIPT = Path.home() / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py"

FRAME_COUNT = 7
PK_FRAME_W = 148
PK_FRAME_H = 84
PADDING_X = 6
PADDING_Y = 8

FRAME_OUTPUT_NAMES = [
    "student-monster-pk-frame-01.png",
    "student-monster-pk-anim-frame-02.png",
    "student-monster-pk-anim-frame-03.png",
    "student-monster-pk-anim-frame-04.png",
    "student-monster-pk-anim-frame-05.png",
    "student-monster-pk-anim-frame-06.png",
    "student-monster-pk-anim-frame-07.png",
]


def chroma_key(source_path, work_dir):
    source = Image.open(source_path).convert("RGBA")
    if source.mode == "RGBA" and source.getchannel("A").getextrema()[0] < 255:
        return source

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
                "--auto-key",
                "border",
                "--soft-matte",
                "--transparent-threshold",
                "12",
                "--opaque-threshold",
                "220",
                "--despill",
                "--force",
            ],
            check=True,
        )
        return Image.open(keyed_path).convert("RGBA")

    from PIL import ImageChops

    rgb = source.convert("RGB")
    white = Image.new("RGB", rgb.size, "white")
    diff = ImageChops.difference(rgb, white).convert("L")
    mask = diff.point(lambda value: 255 if value > 18 else 0)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(mask)
    return rgba


def content_bbox(image):
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > 16 else 0)
    return visible.getbbox()


def split_sheet(source, frame_count):
    cell_width = source.width // frame_count
    frames = []
    for index in range(frame_count):
        cell = source.crop((index * cell_width, 0, (index + 1) * cell_width, source.height))
        frames.append(cell)
    return frames


def load_individual_frames(frame_paths):
    if len(frame_paths) != FRAME_COUNT:
        raise ValueError(f"Expected {FRAME_COUNT} frame images, got {len(frame_paths)}")
    return [chroma_key(Path(path), MONSTER_DIR / ".pk-build") for path in frame_paths]


def reference_stage_box(raw_frames):
    """Use frame 1 as the fixed crop window for every pose."""
    ref_box = content_bbox(raw_frames[0])
    if ref_box is None:
        raise ValueError("Reference frame has no visible content")

    left, top, right, bottom = ref_box
    canvas_w, canvas_h = raw_frames[0].size
    pad_x = 24
    pad_top = 36
    pad_bottom = 12
    return (
        max(0, left - pad_x),
        max(0, top - pad_top),
        min(canvas_w, right + pad_x),
        min(canvas_h, bottom + pad_bottom),
    )


def normalize_pk_frames(raw_frames, from_sheet=False):
    """Render every pose into the exact same PK frame slot."""
    if from_sheet:
        return [
            frame.resize((PK_FRAME_W, PK_FRAME_H), Image.Resampling.LANCZOS)
            for frame in raw_frames
        ]

    crop_box = reference_stage_box(raw_frames)
    ref_crop = raw_frames[0].crop(crop_box)
    inner_w = PK_FRAME_W - PADDING_X * 2
    inner_h = PK_FRAME_H - PADDING_Y * 2
    scale = min(inner_w / ref_crop.width, inner_h / ref_crop.height, 1.0)
    slot_w = max(1, round(ref_crop.width * scale))
    slot_h = max(1, round(ref_crop.height * scale))
    slot_x = (PK_FRAME_W - slot_w) // 2
    slot_y = PK_FRAME_H - PADDING_Y - slot_h

    normalized = []
    for frame in raw_frames:
        crop = frame.crop(crop_box)
        scaled = crop.resize((slot_w, slot_h), Image.Resampling.LANCZOS)
        out = Image.new("RGBA", (PK_FRAME_W, PK_FRAME_H), (0, 0, 0, 0))
        out.alpha_composite(scaled, (slot_x, slot_y))
        normalized.append(out)

    return normalized


def build_sprite(frames, output_path):
    sprite = Image.new("RGBA", (PK_FRAME_W * len(frames), PK_FRAME_H), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sprite.alpha_composite(frame, (index * PK_FRAME_W, 0))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sprite.save(output_path, optimize=True)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Build normalized 7-frame PK sprite assets.")
    parser.add_argument("source", nargs="?", default=str(SOURCE_DEFAULT))
    parser.add_argument(
        "--frames",
        nargs="+",
        help="Build from 7 individual frame images instead of a sprite sheet",
    )
    args = parser.parse_args()

    work_dir = MONSTER_DIR / ".pk-build"
    work_dir.mkdir(parents=True, exist_ok=True)

    from_sheet = not args.frames
    if args.frames:
        raw_frames = load_individual_frames(args.frames)
    else:
        source_path = Path(args.source)
        if not source_path.exists():
            raise FileNotFoundError(f"PK source sheet not found: {source_path}")
        keyed = chroma_key(source_path, work_dir)
        keyed.save(work_dir / "student-monster-pk-7frames-keyed.png", optimize=True)
        raw_frames = split_sheet(keyed, FRAME_COUNT)

    normalized = normalize_pk_frames(raw_frames, from_sheet=from_sheet)

    for output_name, frame in zip(FRAME_OUTPUT_NAMES, normalized):
        frame.save(MONSTER_DIR / output_name, optimize=True)

    build_sprite(normalized, HOME_DIR / "student-monster-pk-sprite.png")
    print(f"Built {FRAME_COUNT} PK frames and sprite in {HOME_DIR}")


if __name__ == "__main__":
    main()
