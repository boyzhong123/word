#!/usr/bin/env bash
# Generate VIP membership icons (jelly monster style).
# Usage:
#   generate-vip-step-icons.sh [loop|path|all]
# Prefers Codex imagegen; falls back to APINebula image-compose (gpt-image-2-vip).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
OUT_DIR="$ROOT/assets/vip"
MASCOT_REF="$ROOT/images/home/today-route-guide-mascot.png"
STYLE_REF="$ROOT/assets/vip-step-monster-style-ref.png"
TARGET="${1:-loop}"

generate_batch() {
  local prompts="$1"
  local extra_ref="${2:-}"

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    out="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["out"])' "$line")"
    prompt="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["prompt"])' "$line")"
    size="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("size", "1024x1024"))' "$line")"
    echo "== Generating $out =="
    if [[ "$USE_COMPOSE" -eq 1 ]]; then
      refs=(-i "$MASCOT_REF" -i "$STYLE_REF")
      if [[ -n "$extra_ref" && -f "$extra_ref" ]]; then
        refs+=(-i "$extra_ref")
      fi
      python3 "$COMPOSE" edit \
        -p "$prompt" \
        "${refs[@]}" \
        --size 2048x2048 \
        --quality high \
        --resize 1024 \
        -o "$OUT_DIR/$out"
    else
      quality="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("quality", "high"))' "$line")"
      args=(--model gpt-image-2 --image "$MASCOT_REF" --image "$STYLE_REF")
      if [[ -n "$extra_ref" && -f "$extra_ref" ]]; then
        args+=(--image "$extra_ref")
      fi
      python3 "$IMAGE_GEN" edit \
        "${args[@]}" \
        --background opaque \
        --output-format png \
        --size "$size" \
        --quality "$quality" \
        --no-augment \
        --prompt "$prompt" \
        --out "$OUT_DIR/$out" \
        --force
    fi
  done < "$prompts"
}

if [[ ! -f "$MASCOT_REF" ]]; then
  echo "missing mascot reference: $MASCOT_REF" >&2
  exit 1
fi

if [[ ! -f "$STYLE_REF" ]]; then
  for candidate in \
    "$ROOT/assets/Google_Chrome_2026-06-24_14.12.54-cf3ffade-5acd-4cb9-b3de-a984b32ed26b.png" \
    "$HOME/.cursor/projects/Users-zhong-Downloads-proverbs/assets/Google_Chrome_2026-06-24_14.12.54-cf3ffade-5acd-4cb9-b3de-a984b32ed26b.png"; do
    if [[ -f "$candidate" ]]; then
      cp "$candidate" "$STYLE_REF"
      break
    fi
  done
fi

if [[ ! -f "$STYLE_REF" ]]; then
  echo "missing style reference: $STYLE_REF" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

if [[ -z "${OPENAI_API_KEY:-}" && -f "$CODEX_HOME/auth.json" ]]; then
  OPENAI_API_KEY="$(
    CODEX_HOME="$CODEX_HOME" python3 - <<'PY'
import json, os
from pathlib import Path
data = json.loads((Path(os.environ["CODEX_HOME"]) / "auth.json").read_text(encoding="utf-8"))
print(data.get("OPENAI_API_KEY", "") or "")
PY
  )"
  export OPENAI_API_KEY
fi

if [[ -n "${OPENAI_API_KEY:-}" && -f "$IMAGE_GEN" ]]; then
  GEN_MODE="imagegen"
  USE_COMPOSE=0
elif [[ -f "$COMPOSE" ]]; then
  GEN_MODE="compose"
  USE_COMPOSE=1
else
  echo "Need OPENAI_API_KEY + imagegen, or image-compose CLI." >&2
  exit 1
fi

echo "Using generator: $GEN_MODE (target=$TARGET)"

LOOP_PROMPTS="$ROOT/tmp/imagegen/vip-step-icon-prompts.jsonl"
PATH_PROMPTS="$ROOT/tmp/imagegen/vip-path-icon-prompts.jsonl"
LOOP_REF="$ROOT/images/vip/step-word.jpg"

case "$TARGET" in
  loop)
    generate_batch "$LOOP_PROMPTS"
    python3 "$ROOT/scripts/build-vip-step-assets.py" --loop
    ;;
  path)
    generate_batch "$PATH_PROMPTS" "$LOOP_REF"
    python3 "$ROOT/scripts/build-vip-step-assets.py" --path
    ;;
  all)
    generate_batch "$LOOP_PROMPTS"
    generate_batch "$PATH_PROMPTS" "$LOOP_REF"
    python3 "$ROOT/scripts/build-vip-step-assets.py" --all
    ;;
  *)
    echo "usage: $0 [loop|path|all]" >&2
    exit 1
    ;;
esac

echo
echo "Done."
