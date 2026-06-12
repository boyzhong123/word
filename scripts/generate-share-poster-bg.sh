#!/usr/bin/env bash
# Generate share poster sources at exact 5:8 portrait (1280x2048).
# Requires OPENAI_API_KEY. Built-in imagegen cannot control output size.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
PROMPTS="$ROOT/tmp/imagegen/share-poster-prompts.jsonl"
OUT_DIR="$ROOT/assets"

if [[ ! -f "$IMAGE_GEN" ]]; then
  echo "missing imagegen CLI: $IMAGE_GEN" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required for exact 1280x2048 generation." >&2
  exit 1
fi

python3 "$IMAGE_GEN" generate-batch \
  --input "$PROMPTS" \
  --out-dir "$OUT_DIR" \
  --concurrency 4 \
  --force

python3 "$ROOT/scripts/build-share-poster-bg.py"
