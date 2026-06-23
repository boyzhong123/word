#!/usr/bin/env bash
# Regenerate home/growth tab hero banners (boy + girl) with growth/history theme.
# Jelly mascot identity is locked to the original PK homepage hero monster.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO_BOY="$ROOT/images/home/hero-campus-jelly-v5.png"
HERO_GIRL="$ROOT/images/home/hero-campus-jelly-v5-girl.png"
PK_HERO_BOY="$ROOT/assets/growth-hero-backup-20260623/hero-campus-jelly-v5.png"
PK_HERO_GIRL="$ROOT/assets/growth-hero-backup-20260623/hero-campus-jelly-v5-girl.png"
JELLY_CROP="$ROOT/assets/hero-pk-jelly-crop-ref.png"
JELLY_UI_REF="$ROOT/assets/hero-pk-jelly-identity-ref.png"
IDENTITY="$ROOT/images/home/map/monsters/jelly-fighting.png"
SCENE_REF="$ROOT/assets/hero-growth-v2-boy-source.png"
ASSET_DIR="$ROOT/assets"
VERSION="v3"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$PK_HERO_BOY" "$PK_HERO_GIRL" "$JELLY_CROP" "$JELLY_UI_REF" "$IDENTITY"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

mkdir -p "$ASSET_DIR"

JELLY_IDENTITY="CRITICAL MONSTER IDENTITY: the green jelly mascot MUST be the exact same 3D character model as the jelly-crop reference and the PK homepage hero monster on the right side of the PK hero image. Copy it exactly — do NOT redesign. Same translucent lime-green jelly slime body with tiny internal bubbles and sparkles, glossy wet highlights, yellow ridged horns, pear-shaped stubby limbs. Face must match exactly: large round WHITE eyeballs (not green-filled eyes) with dark green pupils and bright catchlights; thick dark green angry-cute eyebrows; wide open mouth with red/pink interior and one small upper tooth. Same vivid saturated lime-green as PK hero. NOT darker green, NOT opaque, NOT new eye style, NOT glasses, NOT spikes."

BASE_STYLE="Polished 3D mobile-learning homepage hero banner, same Pixar-like premium toy render as PK hero reference: bright saturated sunny campus colors, soft studio lighting, lush green lawn, blue sky with fluffy clouds, classic red-roof school building in background. Wide horizontal 3:2 landscape composition. Left third kept relatively clean and airy for UI text overlay (Hi nickname). NO VS star, NO lightning bolt, NO duel, NO padlock, NO text, NO watermark."

GROWTH_THEME="Theme is learning GROWTH and study HISTORY progress — a winding colorful stone learning path with glowing milestone nodes and small flag markers stretching across the campus lawn into the distance like a growth journey map. Floating subtle progress motifs: tiny upward bar chart, calendar page with green checkmarks, open vocabulary book with star stickers, small sprouting plant beside the path. Mood: warm encouragement, steady daily progress, vocabulary growing bigger."

SCENE_ARGS=()
if [[ -f "$SCENE_REF" ]]; then
  SCENE_ARGS=(-i "$SCENE_REF")
  SCENE_HINT="Use the growth-scene reference only for path/props layout. Monster design must come from jelly-crop and PK hero references, not from growth-scene monster."
else
  SCENE_HINT=""
fi

python3 "$COMPOSE" edit \
  -p "Growth page hero banner — BOY student version. $BASE_STYLE $GROWTH_THEME $SCENE_HINT $JELLY_IDENTITY Characters: cheerful elementary school BOY in white shirt, blue striped tie, blue shorts, blue sneakers, holding blue star book under arm, standing on the path with confident friendly smile (NOT battle stance). Beside him: the PK homepage jelly mascot in a friendly encouraging pose — one stubby arm pointing toward the winding learning path, other arm doing a small cheer fist (cute, not aggressive). Jelly must look like the same character from PK hero, only pose changed. Characters on center-right; leave left side open." \
  -i "$JELLY_CROP" -i "$PK_HERO_BOY" -i "$JELLY_UI_REF" -i "$IDENTITY" "${SCENE_ARGS[@]}" \
  -o "$ASSET_DIR/hero-growth-${VERSION}-boy-source.png" \
  --size 3840x2160 \
  --resize 1536

python3 "$COMPOSE" edit \
  -p "Growth page hero banner — GIRL student version. $BASE_STYLE $GROWTH_THEME $JELLY_IDENTITY Keep the exact same scene layout, path, props, and jelly mascot from the boy growth hero. Replace only the student with the cheerful elementary school GIRL from the girl PK hero reference: brown ponytail with pink bow, white shirt, pink ribbon, blue pleated skirt, pink sneakers, holding blue star book, friendly confident smile (NOT battle stance). Jelly mascot must remain identical to boy version and PK hero monster. Characters on center-right; leave left side open." \
  -i "$ASSET_DIR/hero-growth-${VERSION}-boy-source.png" -i "$PK_HERO_GIRL" -i "$JELLY_CROP" -i "$IDENTITY" \
  -o "$ASSET_DIR/hero-growth-${VERSION}-girl-source.png" \
  --size 3840x2160 \
  --resize 1536

for variant in boy girl; do
  src="$ASSET_DIR/hero-growth-${VERSION}-${variant}-source.png"
  tmp="$ASSET_DIR/hero-growth-${VERSION}-${variant}-tmp.png"
  sips -z 1024 1536 "$src" --out "$tmp" >/dev/null
  mv "$tmp" "$src"
done

cp "$ASSET_DIR/hero-growth-${VERSION}-boy-source.png" "$HERO_BOY"
cp "$ASSET_DIR/hero-growth-${VERSION}-girl-source.png" "$HERO_GIRL"

echo "Built growth heroes ${VERSION}:"
ls -lh "$HERO_BOY" "$HERO_GIRL" "$ASSET_DIR"/hero-growth-${VERSION}-*-source.png
