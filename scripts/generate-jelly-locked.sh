#!/usr/bin/env bash
# Regenerate home-map locked jelly monster via imagegen (no sprite splicing).
# Sleeping cloud pose + padlock badge for VIP/locked levels.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO="$ROOT/images/home/hero-campus-jelly-v5-girl.png"
POSE_REF="$ROOT/images/plan/plan-mascot-easy.png"
ASSET_DIR="$ROOT/assets"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

if [[ ! -f "$HERO" ]]; then
  echo "missing hero reference: $HERO" >&2
  exit 1
fi

mkdir -p "$ASSET_DIR"

BASE_STYLE="Same green jelly slime monster species as hero reference: translucent lime-green jelly body with tiny internal bubbles, glossy wet highlights, yellow ridged horns, pear-shaped stubby limbs, premium toy-like 3D mobile-learning mascot. Soft sunny studio lighting, bright saturated polished colors."

python3 "$COMPOSE" edit \
  -p "Home map LOCKED level monster icon — brand new generation, not a crop. $BASE_STYLE Action: lounging peacefully on a tiny fluffy white cloud pillow, lying on its back with stubby arms folded behind head, one leg casually crossed, blissful closed eyes and soft smile. Three tiny floating green Zzz sleep symbols near head — same relaxed sleeping vibe as pose reference. Include ONE small cute 3D padlock prop floating beside the RIGHT side of the cloud at MID-HEIGHT (silver lock body, gold shackle, closed) — padlock must sit next to the cloud, NOT on the ground below, NOT tucked under the cloud edge. Padlock clearly visible and smaller than the monster. NOT sitting upright, NOT meditation pose, NOT fighting. Centered composition for mobile UI card. Flat solid pure white background #FFFFFF, no gradient, no floor shadow, no text, no campus, no girl, no boy. Square icon." \
  -i "$HERO" -i "$POSE_REF" \
  -o "$ASSET_DIR/jelly-locked-v3-draft-source.png" \
  --resize 1024

python3 "$ROOT/scripts/flood_key_white_bg.py" \
  "$ASSET_DIR/jelly-locked-v3-draft-source.png" \
  "$ASSET_DIR/jelly-locked-v3-draft-preview.png" \
  --keyed-out "$ASSET_DIR/jelly-locked-v3-draft-keyed.png" \
  --size 512

python3 "$ROOT/scripts/build-jelly-locked-v3.py"

echo "Built jelly-locked v3:"
ls -1 "$ROOT/images/home/map/monsters/jelly-locked.png"
