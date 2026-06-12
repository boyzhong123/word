#!/usr/bin/env bash
# Generate seek-thumb mascot style variations, then build static preview PNGs.
# Requires OPENAI_API_KEY.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
PROMPTS="$ROOT/tmp/imagegen/seek-thumb-style-prompts.jsonl"
ASSETS_DIR="$ROOT/assets"
PREVIEW_DIR="$ROOT/images/listen/seek-thumb-styles"

if [[ ! -f "$IMAGE_GEN" ]]; then
  echo "missing imagegen CLI: $IMAGE_GEN" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required." >&2
  exit 1
fi

python3 "$IMAGE_GEN" generate-batch \
  --input "$PROMPTS" \
  --out-dir "$ASSETS_DIR" \
  --concurrency 3 \
  --force

python3 "$ROOT/scripts/build-seek-thumb-style-previews.py" --out-dir "$PREVIEW_DIR"

echo
echo "Preview PNGs:"
ls -1 "$PREVIEW_DIR"/*.png
