#!/usr/bin/env bash
# Generate today-route progress bar whistle + finish flag icons.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
ROUTE_ICON="$ROOT/images/home/icon-today-route-jelly.png"
CLIPBOARD_ICON="$ROOT/images/home/icon-study-plan-clipboard-jelly.png"
WHISTLE_OUT="$ROOT/assets/today-route-bar-whistle-source.png"
FLAG_OUT="$ROOT/assets/today-route-bar-flag-source.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$ROUTE_ICON" "$CLIPBOARD_ICON"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

mkdir -p "$ROOT/assets"

WHISTLE_PROMPT="Single small 3D UI icon of a cute referee whistle for a kids learning app progress bar START marker. Match the EXACT glossy jelly 3D plastic toy style from the reference icons: soft rounded chunky shapes, premium mobile app icon rendering, subtle highlights and shadows, Pixar-like material quality. Whistle only: classic pea whistle shape, warm sunny yellow body with lighter golden-yellow highlights, small warm orange mouthpiece ring, tiny lanyard loop on top optional. NO text, NO hands, NO character, NO background scene. Flat solid pure magenta background exactly #ff00ff with no gradient. CRITICAL FRAMING: single object centered, occupies at most 55% of canvas, 25% safe margin on every side, no clipping."

FLAG_PROMPT="Single small 3D UI icon of a finish-line red flag on a short wooden pole for a kids learning app progress bar END marker. Match the EXACT glossy 3D plastic toy style from the reference route path icon: same flag shape and pole proportions as the small green flag at the path end in the route icon reference, but flag cloth is vivid red with subtle fabric folds, light brown wooden pole. Same premium mobile-learning mascot material quality, soft rounded chunky 3D render. NO winding path, NO checkmarks, NO text, NO character. Flat solid pure magenta background exactly #ff00ff with no gradient. CRITICAL FRAMING: single object centered, occupies at most 55% of canvas, 25% safe margin on every side, no clipping."

python3 "$COMPOSE" edit \
  -p "$WHISTLE_PROMPT" \
  -i "$ROUTE_ICON" \
  -i "$CLIPBOARD_ICON" \
  -o "$WHISTLE_OUT" \
  --resize 1024

python3 "$COMPOSE" edit \
  -p "$FLAG_PROMPT" \
  -i "$ROUTE_ICON" \
  -i "$CLIPBOARD_ICON" \
  -o "$FLAG_OUT" \
  --resize 1024

python3 "$ROOT/scripts/build-today-route-bar-icons.py"

echo "Built today route bar icons:"
ls -1 "$ROOT/images/home/icon-today-route-bar-whistle-jelly.png"
ls -1 "$ROOT/images/home/icon-today-route-bar-flag-jelly.png"
