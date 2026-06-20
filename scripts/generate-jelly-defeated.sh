#!/usr/bin/env bash
# Regenerate home-map defeated jelly monster via imagegen.
# Surrender pose: holding a small white flag, begging for mercy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO="$ROOT/images/home/hero-campus-jelly-v5-girl.png"
CURRENT="$ROOT/images/home/map/monsters/jelly-defeated.png"
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
  -p "Home map DEFEATED level monster icon — brand new generation, not a crop. $BASE_STYLE Action: sitting slumped in comedic surrender. ONE stubby right arm raised, holding a small warm cream-yellow off-white surrender flag on a thin wooden stick — only ONE visible hand gripping the pole. Flag color is slightly warm yellow-cream, NOT pure cold white, NOT gray. The flag must be clean and intact: smooth straight edges, NOT torn, NOT frayed, NOT tattered, NOT ripped. Left arm tucked completely behind the round jelly body, NOT visible from front view, no second hand, no third hand, no extra limb on belly or side. Big glossy teary pleading eyes, trembling mouth, tiny sweat drop, pink blush. Defeated begging mood — NOT spiral dizzy eyes, NOT stars spinning, NOT knocked-out tongue. Centered for mobile UI card. Flat solid pure white background #FFFFFF, no gradient, no shadow, no text. Square icon." \
  -i "$HERO" -i "$CURRENT" \
  -o "$ASSET_DIR/jelly-defeated-v3-draft-source.png" \
  --resize 1024

python3 "$ROOT/scripts/flood_key_white_bg.py" \
  "$ASSET_DIR/jelly-defeated-v3-draft-source.png" \
  "$ASSET_DIR/jelly-defeated-v3-draft-preview.png" \
  --keyed-out "$ASSET_DIR/jelly-defeated-v3-draft-keyed.png" \
  --tolerance 10 \
  --size 512

python3 "$ROOT/scripts/build-jelly-defeated-v3.py"

echo "Built jelly-defeated v3:"
ls -1 "$ROOT/images/home/map/monsters/jelly-defeated.png"
