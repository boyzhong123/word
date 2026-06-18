#!/usr/bin/env bash
# Generate study-plan jelly mascot icons (easy / normal / hard) via imagegen.
# Style from homepage hero only — poses are unique to the plan page.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO="$ROOT/images/home/hero-campus-jelly-v5.png"
OUT_DIR="$ROOT/images/plan"
ASSET_DIR="$ROOT/assets"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

mkdir -p "$ASSET_DIR" "$OUT_DIR"

BASE_STYLE="Same green jelly slime monster species as reference: translucent lime-green jelly body with tiny internal bubbles, glossy wet highlights, yellow ridged horns, pear-shaped stubby limbs, premium toy-like 3D mobile-learning mascot. NO campus, NO girl, NO boy, NO text, NO padlock, NO VS. Centered single character only. Flat solid pure white background #FFFFFF, no gradient, no floor shadow. Square composition for mobile UI icon."

python3 "$COMPOSE" edit \
  -p "Study plan EASY mascot — brand new pose. $BASE_STYLE Action: lounging lazily on a tiny fluffy white cloud pillow, lying on its back with arms folded behind head, one stubby leg crossed, blissful half-closed eyes and soft smile. Three tiny floating Zzz sleep symbols near head. Vacation chill mood. NOT sitting upright, NOT meditation, NOT locked pose." \
  -i "$HERO" \
  -o "$ASSET_DIR/plan-mascot-easy-source.png" \
  --resize 512

python3 "$COMPOSE" edit \
  -p "Study plan NORMAL mascot — brand new pose. $BASE_STYLE Action: mid-stride brisk walk, dynamic forward motion, holding a tiny open green vocabulary book in one hand, other hand raised in cheerful wave, bright eager eyes, slight forward lean. Energetic study-walk mood. NOT standing still, NOT fighting punch, NOT boxing stance." \
  -i "$HERO" \
  -o "$ASSET_DIR/plan-mascot-normal-source.png" \
  --resize 512

python3 "$COMPOSE" edit \
  -p "Study plan HARD mascot — brand new pose. $BASE_STYLE Action: struggling to carry a tall wobbly stack of four colorful textbooks above its head, leaning back from the weight, knees bent and wobbling, big translucent sweat drops on forehead, strained cute gritted-teeth expression, tiny effort steam puffs from head. Overloaded homework burden. NOT dizzy spiral eyes, NOT defeated slump, NOT stars spinning." \
  -i "$HERO" \
  -o "$ASSET_DIR/plan-mascot-hard-source.png" \
  --resize 512

python3 "$ROOT/scripts/flood_key_white_bg.py" "$ASSET_DIR/plan-mascot-easy-source.png" "$OUT_DIR/plan-mascot-easy.png"
python3 "$ROOT/scripts/flood_key_white_bg.py" "$ASSET_DIR/plan-mascot-normal-source.png" "$OUT_DIR/plan-mascot-normal.png"
python3 "$ROOT/scripts/flood_key_white_bg.py" "$ASSET_DIR/plan-mascot-hard-source.png" "$OUT_DIR/plan-mascot-hard.png"

echo "Built plan mascots:"
ls -1 "$OUT_DIR"/plan-mascot-*.png
