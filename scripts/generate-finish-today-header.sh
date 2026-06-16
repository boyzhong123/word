#!/usr/bin/env bash
# Generate finish/today header sources via imagegen edit (homepage hero style), then export banners.
# Requires OPENAI_API_KEY (or Codex auth.json).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
PROMPTS="$ROOT/tmp/imagegen/finish-today-header-prompts.jsonl"
OUT_DIR="$ROOT/assets"
HERO_REF="$ROOT/images/home/hero-campus-jelly-v5.png"
MASCOT_REF="$ROOT/images/home/mascot-report-jelly.png"
STAR_REF="$ROOT/images/home/stage-star-filled.png"
MODEL="gpt-image-1.5"

if [[ ! -f "$IMAGE_GEN" ]]; then
  echo "missing imagegen CLI: $IMAGE_GEN" >&2
  exit 1
fi

if [[ ! -f "$HERO_REF" ]]; then
  echo "missing homepage hero reference: $HERO_REF" >&2
  exit 1
fi

if [[ ! -f "$MASCOT_REF" ]]; then
  echo "missing report mascot reference: $MASCOT_REF" >&2
  exit 1
fi

if [[ ! -f "$STAR_REF" ]]; then
  echo "missing stage star reference: $STAR_REF" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" && -f "$CODEX_HOME/auth.json" ]]; then
  export OPENAI_API_KEY="$(
    CODEX_HOME="$CODEX_HOME" python3 - <<'PY'
import json
import os
from pathlib import Path

auth = Path(os.environ["CODEX_HOME"]) / "auth.json"
data = json.loads(auth.read_text(encoding="utf-8"))
print(data.get("OPENAI_API_KEY", ""))
PY
  )"
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required for imagegen generation." >&2
  exit 1
fi

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  out="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["out"])' "$line")"
  prompt="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["prompt"])' "$line")"
  size="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("size", "1536x1024"))' "$line")"
  python3 "$IMAGE_GEN" edit \
    --model "$MODEL" \
    --image "$HERO_REF" \
    --image "$MASCOT_REF" \
    --image "$STAR_REF" \
    --input-fidelity high \
    --background opaque \
    --output-format png \
    --size "$size" \
    --quality high \
    --no-augment \
    --prompt "$prompt" \
    --out "$OUT_DIR/$out" \
    --force
done < "$PROMPTS"

python3 "$ROOT/scripts/build-finish-today-header.py"

echo
echo "Built finish/today headers:"
ls -1 "$ROOT/images/finish"/finish-today-header-*star.png
