#!/usr/bin/env bash
# Generate the home toast hint monster via imagegen edit, then build the runtime icon.
# The toast renders at 64rpx, so the build step exports a 192px (@3x) PNG.
# Requires OPENAI_API_KEY.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
OUT="$ROOT/assets/toast-hint-source.png"
ALERT_REF="$ROOT/images/home/mascot-alert.png"
LOCKED_REF="$ROOT/images/home/map/monsters/jelly-locked.png"

if [[ ! -f "$IMAGE_GEN" ]]; then
  echo "missing imagegen CLI: $IMAGE_GEN" >&2
  exit 1
fi

if [[ ! -f "$ALERT_REF" ]]; then
  echo "missing home mascot reference: $ALERT_REF" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required for imagegen generation." >&2
  exit 1
fi

python3 "$IMAGE_GEN" edit \
  --model gpt-image-1.5 \
  --image "$ALERT_REF" \
  --input-fidelity high \
  --background transparent \
  --output-format png \
  --size 1024x1024 \
  --quality high \
  --prompt "Faithfully keep the exact same home-page little monster: translucent lime-green jelly slime body with glossy wet highlights and tiny internal bubbles, yellow ridged horns, pear-shaped sitting pose, polished 3D mobile-game mascot rendering with soft studio lighting. NOT flat 2D cartoon, NOT bundt-cake shape. Change only the pose for a toast hint: alert friendly expression with big shiny eyes open, one small stubby arm raised with index finger pointing upward, and a small soft amber circular badge with white exclamation mark floating near the upper right of the head. Also match the map monster material from the locked jelly reference. Centered character only, no padlock, no text, no floor shadow, transparent background, square icon composition." \
  --out "$OUT" \
  --force

python3 "$ROOT/scripts/build-word-new-assets.py"
