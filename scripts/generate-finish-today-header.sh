#!/usr/bin/env bash
# Generate finish/today header sources via imagegen edit (monster as reference), then export banners.
# Requires OPENAI_API_KEY.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
PROMPTS="$ROOT/tmp/imagegen/finish-today-header-prompts.jsonl"
OUT_DIR="$ROOT/assets"
MONSTER_REF="$ROOT/assets/_archive/images/home/jelly-green-monster-base-keyed.png"

if [[ ! -f "$IMAGE_GEN" ]]; then
  echo "missing imagegen CLI: $IMAGE_GEN" >&2
  exit 1
fi

if [[ ! -f "$MONSTER_REF" ]]; then
  echo "missing jelly monster reference: $MONSTER_REF" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required for imagegen generation." >&2
  exit 1
fi

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  out="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["out"])' "$line")"
  prompt="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["prompt"])' "$line")"
  python3 "$IMAGE_GEN" edit \
    --image "$MONSTER_REF" \
    --input-fidelity high \
    --prompt "$prompt" \
    --size 1536x1024 \
    --quality high \
    --out "$OUT_DIR/$out" \
    --force
done < "$PROMPTS"

# Sources -> assets/*-source.png (not uploaded). Banners -> images/finish/*.jpg only.
python3 "$ROOT/scripts/build-finish-today-header.py"
