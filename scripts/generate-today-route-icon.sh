#!/usr/bin/env bash
# Regenerate today-route header path icon (mint green palette) from jelly 3D style references.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
OUT="$ROOT/assets/icon-today-route-jelly-source.png"
CLIPBOARD_ICON="$ROOT/images/home/icon-study-plan-clipboard-jelly.png"
CURRENT_ICON="$ROOT/images/home/icon-today-route-jelly.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

if [[ ! -f "$CLIPBOARD_ICON" ]]; then
  echo "missing reference: $CLIPBOARD_ICON" >&2
  exit 1
fi

mkdir -p "$ROOT/assets"

PROMPT="Single premium 3D UI icon of a winding learning path roadmap for a kids English-learning mini-program header. Match EXACT glossy jelly 3D plastic toy style from reference: soft rounded chunky shapes, premium mobile app icon rendering, subtle highlights and shadows, Pixar-like material quality. Composition: thick S-curved path receding in perspective from bottom-left to top-right, three raised circular checkpoint buttons on the path each with white center and small emerald green checkmark, small pennant flag at path end on thin pole. COLOR PALETTE (important): path body and flag in vivid mint-emerald green matching progress bar (#34d27b highlights, #22c55e main, #168f3a shadows), checkpoint rings deeper forest green, checkmarks bold green, checkpoint centers clean white. Colors lively and saturated, NOT pale. NOT orange, NOT blue. NO text, NO character mascot, NO background scene. Flat solid pure magenta background exactly #ff00ff with no gradient. CRITICAL FRAMING: single object centered, occupies at most 62% of canvas, 22% safe margin on every side, no clipping, square composition."

REF_ARGS=(-i "$CLIPBOARD_ICON")
if [[ -f "$CURRENT_ICON" ]]; then
  REF_ARGS+=(-i "$CURRENT_ICON")
fi

python3 "$COMPOSE" edit \
  -p "$PROMPT" \
  "${REF_ARGS[@]}" \
  -o "$OUT" \
  --size 2048x2048 \
  --resize 512

python3 "$ROOT/scripts/build-today-route-icon.py"

echo "Built today route icon:"
ls -lh "$ROOT/images/home/icon-today-route-jelly.png"
