#!/usr/bin/env python3
"""Chroma-key and resize onboarding first-screen pain + proof icons."""

from pathlib import Path

from guide_asset_utils import fit_asset, remove_chroma

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
OUT_DIR = PROJECT_ROOT / "images" / "onboarding"

PAIN_SIZE = 256
PAIN_PADDING = 18
PROOF_SIZE = 128
PROOF_PADDING = 10

PAIN_TARGETS = (
    ("onboard-pain-plan-source.png", "onboard-pain-plan.png"),
    ("onboard-pain-pronounce-source.png", "onboard-pain-pronounce.png"),
    ("onboard-pain-forget-source.png", "onboard-pain-forget.png"),
)

PROOF_TARGETS = (
    ("onboard-proof-textbook-source.png", "onboard-proof-textbook.png"),
    ("onboard-proof-mic-source.png", "onboard-proof-mic.png"),
    ("onboard-proof-review-source.png", "onboard-proof-review.png"),
)


def build_icon(source_name, output_name, size, padding):
    source_path = ASSETS_DIR / source_name
    if not source_path.exists():
        raise FileNotFoundError(f"missing source asset: {source_path}")

    work_dir = OUT_DIR / ".build"
    work_dir.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    image = remove_chroma(source_path, work_dir)
    icon = fit_asset(image, size, size, padding)
    out_path = OUT_DIR / output_name
    icon.save(out_path, optimize=True)
    print(f"built {out_path} ({size}x{size})")


def main():
    for source_name, output_name in PAIN_TARGETS:
        build_icon(source_name, output_name, PAIN_SIZE, PAIN_PADDING)
    for source_name, output_name in PROOF_TARGETS:
        build_icon(source_name, output_name, PROOF_SIZE, PROOF_PADDING)


if __name__ == "__main__":
    main()
