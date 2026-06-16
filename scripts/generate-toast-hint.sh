#!/usr/bin/env bash
# Generate the home toast hint monster via imagegen edit, then build the runtime icon.
# The toast renders at 64rpx, so the build step exports a 192px (@3x) PNG.
# Requires OPENAI_API_KEY.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
OUT="$ROOT/assets/toast-hint-source.png"
HERO_REF="$ROOT/images/home/hero-campus-jelly-v5.png"
ALERT_REF="$ROOT/images/home/mascot-alert.png"
LOCKED_REF="$ROOT/images/home/map/monsters/jelly-locked.png"

if [[ ! -f "$IMAGE_GEN" ]]; then
  echo "missing imagegen CLI: $IMAGE_GEN" >&2
  exit 1
fi

if [[ ! -f "$HERO_REF" ]]; then
  echo "missing home hero reference: $HERO_REF" >&2
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
  --image "$HERO_REF" \
  --image "$ALERT_REF" \
  --image "$LOCKED_REF" \
  --input-fidelity high \
  --background opaque \
  --output-format png \
  --size 1024x1024 \
  --quality high \
  --prompt "App UI toast hint icon. Match the exact green jelly monster from the homepage header hero reference: same translucent lime-green jelly slime material with tiny internal bubbles, glossy wet highlights, yellow ridged horns, premium toy-like 3D mobile-learning mascot rendering, soft sunny studio lighting, bright saturated but polished colors, rounded friendly shapes. Use the alert mascot reference for face proportions and the locked jelly reference for seated pear-shaped body material. Toast hint pose only: friendly alert expression with big shiny eyes open, one small stubby arm raised with ONLY the index finger pointing upward (other fingers curled), small soft amber circular badge with white exclamation mark floating near upper right of head. Softer and cleaner than a neon glow look; no harsh bloom, no outer glow halo. Centered character only, no boy, no VS, no campus, no padlock, no text, no floor shadow. Flat solid pure magenta background exactly #ff00ff with no gradient. Square icon composition, crisp edges for downscaling to 192px mobile UI icon." \
  --out "$OUT" \
  --force

python3 "$ROOT/scripts/build-word-new-assets.py"
