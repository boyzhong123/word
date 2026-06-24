#!/usr/bin/env bash
# Regenerate today-summary header icon (mint jelly 3D) to match textbook-sync style.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
OUT="$ROOT/assets/icon-today-summary-jelly-source.png"
TEXTBOOK_SOURCE="$ROOT/assets/icon-today-textbook-sync-jelly-source.png"
STREAK_ICON="$ROOT/images/home/icon-today-streak.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

if [[ ! -f "$TEXTBOOK_SOURCE" ]]; then
  echo "missing reference: $TEXTBOOK_SOURCE" >&2
  exit 1
fi

mkdir -p "$ROOT/assets"

PROMPT="Single premium 3D UI icon for a kids English-learning mini-program section titled Today's Summary (今日小结). Match EXACT glossy jelly 3D plastic toy style from reference book icon: soft rounded chunky shapes, premium mobile app icon rendering, subtle highlights and shadows, Pixar-like material quality, same camera angle and scale.

Subject: a cute spiral-bound daily notepad / mini calendar pad tilted slightly, representing today's learning recap. Thick mint-emerald green cover frame at top with two small rounded binder rings. White page body with three short horizontal pill-shaped lines (like simplified stats rows). Small circular mint-green badge at bottom-right with a bold white lightning bolt symbol (energy / daily highlight), same badge treatment as the checkmark on the book reference.

COLOR PALETTE (critical): vivid mint-emerald green matching reference (#34d27b highlights, #22c55e main, #168f3a shadows), clean white pages, badge same green family. Lively saturated, NOT pale. NOT orange, NOT blue, NOT purple.

NO text, NO numbers, NO character mascot, NO background scene. Flat solid pure magenta background exactly #ff00ff with no gradient.

CRITICAL FRAMING: single object centered, occupies at most 62% of canvas, 22% safe margin on every side, no clipping, square composition."

REF_ARGS=(-i "$TEXTBOOK_SOURCE")
if [[ -f "$STREAK_ICON" ]]; then
  REF_ARGS+=(-i "$STREAK_ICON")
fi

python3 "$COMPOSE" edit \
  -p "$PROMPT" \
  "${REF_ARGS[@]}" \
  -o "$OUT" \
  --size 2048x2048 \
  --resize 512

python3 "$ROOT/scripts/build-today-summary-icon.py"

echo "Built today summary icon:"
ls -lh "$ROOT/images/home/icon-today-summary-jelly.png"
