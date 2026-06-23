#!/usr/bin/env bash
# Home tab hero — boy + girl + jelly mascot together, 1536×640 wide strip.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO_OUT="$ROOT/images/home/hero-campus-jelly-v5-trio.png"
PK_HERO_BOY="$ROOT/images/home/hero-campus-jelly-v5-pk.png"
PK_HERO_GIRL="$ROOT/images/home/hero-campus-jelly-v5-pk-girl.png"
JELLY_CROP="$ROOT/assets/hero-pk-jelly-crop-ref.png"
JELLY_UI_REF="$ROOT/assets/hero-pk-jelly-identity-ref.png"
IDENTITY="$ROOT/images/home/map/monsters/jelly-fighting.png"
ASSET_DIR="$ROOT/assets"
VERSION="v1"
TARGET_W=1536
TARGET_H=640

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

JELLY_IDENTITY="CRITICAL MONSTER IDENTITY: the green jelly mascot MUST be the exact same 3D character model as the jelly-crop reference and Today PK hero monster. Copy exactly — translucent lime-green jelly slime with bubbles, glossy highlights, yellow ridged horns, stubby limbs. Face: large round WHITE eyeballs, dark green pupils, thick dark green eyebrows, wide mouth with red interior and one small upper tooth."

BASE_STYLE="Polished 3D mobile-learning homepage hero banner, EXACT same Pixar-like render and sunny campus as Today PK hero: bright saturated colors, soft lighting, lush green lawn, blue sky, fluffy clouds, yellow brick archway with star gate, red-roof school with clock tower. CRITICAL: wide shallow 2.4:1 banner (1536×640) — compact low strip, NOT tall poster. Left 38% kept clean and uncluttered for Chinese slogan overlay. NO VS star, NO lightning, NO duel, NO text, NO watermark."

TRIO_SCENE="THREE characters grouped together on the RIGHT and CENTER-RIGHT as a friendly learning team (not fighting): (1) elementary school BOY from boy PK reference — white shirt, blue striped tie, blue shorts, blue sneakers, blue star book; (2) elementary school GIRL from girl PK reference — brown ponytail pink bow, white shirt, pink ribbon, blue pleated skirt, pink sneakers, blue star book; (3) green jelly mascot between or beside them in cheerful encouraging pose — small wave or pointing gesture. All three smiling warmly, same height scale, standing on campus lawn. Boy on left of group, girl on right of group, jelly in middle or slightly forward. Leave entire left side open sky/grass only."

RECORD_THEME="Subtle study-record motifs floating small in upper area only (microphone, checklist, progress chart) — must not enter left slogan zone."

python3 "$COMPOSE" edit \
  -p "Home page hero banner — BOY + GIRL + JELLY TRIO team version. $BASE_STYLE $TRIO_SCENE $RECORD_THEME $JELLY_IDENTITY" \
  -i "$PK_HERO_BOY" -i "$PK_HERO_GIRL" -i "$JELLY_CROP" -i "$JELLY_UI_REF" -i "$IDENTITY" \
  -o "$ASSET_DIR/hero-trio-${VERSION}-source.png" \
  --size 3840x2160 \
  --resize 1920

src="$ASSET_DIR/hero-trio-${VERSION}-source.png"
sips -c "$TARGET_H" "$TARGET_W" --cropOffset 0 0 "$src" --out "$HERO_OUT" >/dev/null

echo "Built trio hero:"
ls -lh "$HERO_OUT" "$src"
