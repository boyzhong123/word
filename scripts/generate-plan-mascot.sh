#!/usr/bin/env bash
# Generate study-plan jelly mascot icons (easy / normal / hard) via imagegen.
# Style locked to homepage PK hero banner; poses are plan-page only.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO="$ROOT/images/home/hero-campus-jelly-v5.png"
IDENTITY="$ROOT/images/home/map/monsters/jelly-fighting.png"
OUT_DIR="$ROOT/images/plan"
ASSET_DIR="$ROOT/assets"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

if [[ ! -f "$HERO" || ! -f "$IDENTITY" ]]; then
  echo "missing homepage references: hero=$HERO identity=$IDENTITY" >&2
  exit 1
fi

mkdir -p "$ASSET_DIR" "$OUT_DIR"

BASE_STYLE="Exact same green jelly monster from the homepage PK VS hero banner — same Pixar-like 3D render, same translucent lime-green jelly slime with tiny internal bubbles and sparkles, glossy wet highlights, yellow ridged horns, pear-shaped stubby limbs, premium mobile-learning mascot. Face must match PK hero monster exactly: large round white eyeballs with dark green pupils and bright catchlights; thick dark green eyebrows; wide mouth with red interior and small upper teeth when open. Bright sunny studio lighting, vivid saturated polished colors like the PK banner — NOT darker, NOT washed out. NO boy, NO girl, NO campus, NO school, NO grass, NO VS star, NO lightning, NO text, NO padlock. Single character centered. Flat solid pure white background #FFFFFF, no gradient, no floor shadow. Square mobile UI icon."

python3 "$COMPOSE" edit \
  -p "Study plan EASY mascot — completely original pose. $BASE_STYLE Action: sprawled sideways on a tiny round inflatable swim ring, wearing cute round sunglasses, one stubby arm lazily holding a tiny juice box with straw, other arm dangling off the ring, blissful half-closed eyes and relaxed smile. Absolute minimum-effort chill mood. NOT sleeping on cloud, NOT balloons, NOT locked pose." \
  -i "$HERO" -i "$IDENTITY" \
  -o "$ASSET_DIR/plan-mascot-easy-source.png" \
  --resize 1024

python3 "$COMPOSE" edit \
  -p "Study plan NORMAL mascot — completely original pose. $BASE_STYLE Action: riding a giant yellow pencil like a witch broom, leaning forward mid-flight, both stubby hands gripping the pencil, big eager confident grin showing teeth, two tiny green flashcards fluttering behind like a trail. Steady daily progress mood. NOT jogging, NOT boxing punch, NOT VS fighting stance, NOT standing still." \
  -i "$HERO" -i "$IDENTITY" \
  -o "$ASSET_DIR/plan-mascot-normal-source.png" \
  --resize 1024

python3 "$COMPOSE" edit \
  -p "Study plan HARD mascot — completely original pose. $BASE_STYLE Action: buried up to chest in a messy avalanche of colorful vocabulary flashcards, only head and ONE raised stubby arm visible above the card pile, that arm holding a small warm cream-yellow surrender flag on a thin wooden pole (flag intact, NOT torn). Big glossy teary pleading eyes, trembling open mouth, pink blush, tiny blue sweat drop. Overloaded study collapse mood. NOT kneeling, NOT spiral dizzy eyes, NOT boxing." \
  -i "$HERO" -i "$IDENTITY" \
  -o "$ASSET_DIR/plan-mascot-hard-source.png" \
  --resize 1024

python3 "$ROOT/scripts/build-plan-mascot-from-source.py"

echo "Built plan mascots:"
ls -1 "$OUT_DIR"/plan-mascot-*.png
