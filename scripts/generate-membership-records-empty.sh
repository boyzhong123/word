#!/usr/bin/env bash
# Generate empty-state illustration for membership purchase records page.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
OUT="$ROOT/assets/membership-records-empty-v4-source.png"
PREV="$ROOT/assets/membership-records-empty-v3-source.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

mkdir -p "$ROOT/assets"

if [[ ! -f "$PREV" ]]; then
  echo "missing reference: $PREV" >&2
  exit 1
fi

PROMPT="Simplified empty-state icon for purchase-records page. TWO-LAYER COLOR RULE — follow exactly: (1) BACKGROUND ONLY: flat solid hot pink magenta exactly #FF00FF, no gradient. (2) SUBJECT ONLY: ONE single empty receipt clipboard from the reference — keep only the clipboard with blank lines and a grey question mark. NO mascot, NO monster, NO character, NO creature, NO hands. Just the clipboard object alone, centered, cool grey monochrome with clear mid-to-dark grey values. NO ground shadow, NO floor. Soft clean 3D mobile empty-state style. Portrait-friendly vertical clipboard, subject at most 55% of canvas height. No text, no watermark."

python3 "$COMPOSE" edit \
  -p "$PROMPT" \
  -i "$PREV" \
  -o "$OUT" \
  --resize 1024

python3 "$ROOT/scripts/build-membership-records-empty.py"

echo "Built membership records empty illustration:"
ls -1 "$ROOT/images/vip/membership-records-empty.png" "$ROOT/vercel-assets/images/vip/membership-records-empty.png"
