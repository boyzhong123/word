#!/usr/bin/env bash
# Generate onboarding first-screen pain + proof sticker icons (today-page jelly style).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
ASSET_DIR="$ROOT/assets"
OUT_DIR="$ROOT/images/onboarding"
TOAST_HINT="$ROOT/images/home/toast-hint.png"
JELLY_FIGHT="$ROOT/images/home/map/monsters/jelly-fighting.png"
ROUTE_ICON="$ROOT/images/home/icon-today-route-jelly.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$TOAST_HINT" "$JELLY_FIGHT" "$ROUTE_ICON"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

mkdir -p "$ASSET_DIR" "$OUT_DIR"

JELLY_ID="Match EXACT homepage jelly mascot from toast-hint and jelly-fighting references: translucent lime-green jelly slime body with tiny internal bubbles, glossy wet highlights, yellow ridged horns, pear-shaped stubby limbs, premium Pixar-like 3D mobile-learning mascot. Face: large round shiny dark eyes with bright catchlights, thick dark green eyebrows, expressive mouth with pink interior. NO white sticker border, NO rounded square card background, NO eyeglasses, NO black eyes with white sclera only."

MAGENTA="Flat solid pure magenta background exactly #ff00ff with no gradient."
FRAME="CRITICAL FRAMING: subject occupies at most 60% of canvas; leave 22% empty safe margin on every side; no clipping; square composition."

generate_pain() {
  local name="$1"
  local prompt="$2"
  python3 "$COMPOSE" edit \
    -p "$prompt" \
    -i "$TOAST_HINT" -i "$JELLY_FIGHT" \
    -o "$ASSET_DIR/onboard-${name}-source.png" \
    --size 2048x2048 \
    --resize 1024
}

generate_proof() {
  local name="$1"
  local prompt="$2"
  python3 "$COMPOSE" edit \
    -p "$prompt" \
    -i "$TOAST_HINT" -i "$ROUTE_ICON" \
    -o "$ASSET_DIR/onboard-${name}-source.png" \
    --size 2048x2048 \
    --resize 512
}

generate_pain "pain-plan" \
  "Onboarding pain-point sticker for kids English learning app. $JELLY_ID Confused pose: jelly mascot scratching head with one stubby arm, looking at small blue textbook with yellow star on cover. Floating warm orange glossy 3D question mark nearby. Mood: not sure what to study today. Single character sticker, no text labels. $MAGENTA $FRAME"

generate_pain "pain-pronounce" \
  "Onboarding pain-point sticker for kids English learning app. $JELLY_ID Jelly mascot holding cute round lime-green jelly microphone near mouth, worried uncertain expression. Small white speech bubble with warm orange question mark. Mood: no one to check if pronunciation is correct. Single character sticker, no text. $MAGENTA $FRAME"

generate_pain "pain-forget" \
  "Onboarding pain-point sticker for kids English learning app. $JELLY_ID Jelly mascot looking worried as three rounded colorful letters A B C float upward and fade away like forgotten memories. Letters use warm orange and sunny yellow accents matching app palette. Mood: forgetting words after memorizing. Single character sticker, no long text. $MAGENTA $FRAME"

generate_proof "proof-textbook" \
  "Small premium 3D UI sticker icon for onboarding value proof. Match glossy jelly 3D toy style from references: blue textbook with yellow star plus tiny green jelly mascot horn peeking from behind book. Theme: synced textbook unit path, organized learning. NO full scene, NO text. $MAGENTA $FRAME"

generate_proof "proof-mic" \
  "Small premium 3D UI sticker icon for onboarding value proof. Match glossy jelly 3D toy style: round lime-green jelly microphone with two soft sound-wave arcs. Theme: AI pronunciation scoring. NO character body, NO text. $MAGENTA $FRAME"

generate_proof "proof-review" \
  "Small premium 3D UI sticker icon for onboarding value proof. Match glossy jelly 3D toy style: circular refresh arrows around small orange quiz card with green checkmark. Theme: wrong-word auto review loop. NO text sentences. $MAGENTA $FRAME"

python3 "$ROOT/scripts/build-onboarding-first-screen-icons.py"

echo "Built onboarding first-screen icons:"
ls -lh "$OUT_DIR"/onboard-pain-*.png "$OUT_DIR"/onboard-proof-*.png
