#!/usr/bin/env bash
# Regenerate home tab hero banners (boy + girl) — wide 1536×640 strip, today PK hero style.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO_BOY="$ROOT/images/home/hero-campus-jelly-v5.png"
HERO_GIRL="$ROOT/images/home/hero-campus-jelly-v5-girl.png"
PK_HERO_BOY="$ROOT/images/home/hero-campus-jelly-v5-pk.png"
PK_HERO_GIRL="$ROOT/images/home/hero-campus-jelly-v5-pk-girl.png"
JELLY_CROP="$ROOT/assets/hero-pk-jelly-crop-ref.png"
JELLY_UI_REF="$ROOT/assets/hero-pk-jelly-identity-ref.png"
IDENTITY="$ROOT/images/home/map/monsters/jelly-fighting.png"
ASSET_DIR="$ROOT/assets"
VERSION="v2"
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

JELLY_IDENTITY="CRITICAL MONSTER IDENTITY: the green jelly mascot MUST be the exact same 3D character model as the jelly-crop reference and the Today tab PK hero monster. Copy it exactly — do NOT redesign. Same translucent lime-green jelly slime body with tiny internal bubbles and sparkles, glossy wet highlights, yellow ridged horns, pear-shaped stubby limbs. Face must match exactly: large round WHITE eyeballs with dark green pupils and bright catchlights; thick dark green angry-cute eyebrows; wide open mouth with red/pink interior and one small upper tooth. Same vivid saturated lime-green as PK hero."

BASE_STYLE="Polished 3D mobile-learning homepage hero banner, EXACT same Pixar-like premium toy render and sunny campus scene as the Today tab PK hero reference: bright saturated colors, soft studio lighting, lush green lawn, blue sky with fluffy clouds, yellow brick archway with star gate on left, classic red-roof school building with clock tower in background. CRITICAL: wide shallow horizontal banner composition about 2.4:1 aspect ratio (1536×640) — compact low strip, NOT a tall poster. Camera pulled back; characters waist-up or full-body but scene compressed vertically. Left third kept clean and airy for Chinese UI slogan text overlay. NO VS star, NO lightning bolt, NO duel, NO padlock, NO text, NO watermark."

RECORD_THEME="Theme is study records and follow-read learning progress — subtle floating motifs only: cute microphone with soft sound-wave arcs, checklist with green checkmarks, small upward progress chart, open vocabulary book with star stickers. Mood: warm encouragement, visible learning progress. Motifs stay small and do not clutter the left slogan area."

python3 "$COMPOSE" edit \
  -p "Home page hero banner — BOY student version, SHORT wide strip matching Today PK hero style. $BASE_STYLE $RECORD_THEME $JELLY_IDENTITY Characters on center-right: cheerful elementary school BOY exactly like Today PK boy reference — white shirt, blue striped tie, blue shorts, blue sneakers, holding blue star book, friendly confident smile (encouraging, NOT battle VS pose). Beside him: Today PK jelly mascot in friendly encouraging pose — one stubby arm pointing forward, other arm small cheer fist. Jelly must match PK hero monster exactly. Leave left third open for slogan." \
  -i "$PK_HERO_BOY" -i "$JELLY_CROP" -i "$JELLY_UI_REF" -i "$IDENTITY" \
  -o "$ASSET_DIR/hero-record-${VERSION}-boy-source.png" \
  --size 3840x2160 \
  --resize 1920

python3 "$COMPOSE" edit \
  -p "Home page hero banner — GIRL student version, SHORT wide strip matching Today PK hero style. $BASE_STYLE $RECORD_THEME $JELLY_IDENTITY Keep the exact same scene layout, campus background, props, and jelly mascot pose from the boy home hero. Replace only the student with the cheerful elementary school GIRL from Today PK girl reference: brown ponytail with pink bow, white shirt, pink ribbon, blue pleated skirt, pink sneakers, holding blue star book, friendly smile. Jelly mascot must remain identical to boy version. Leave left third open." \
  -i "$ASSET_DIR/hero-record-${VERSION}-boy-source.png" -i "$PK_HERO_GIRL" -i "$JELLY_CROP" -i "$IDENTITY" \
  -o "$ASSET_DIR/hero-record-${VERSION}-girl-source.png" \
  --size 3840x2160 \
  --resize 1920

for variant in boy girl; do
  src="$ASSET_DIR/hero-record-${VERSION}-${variant}-source.png"
  # 顶裁到交付尺寸，禁止 sips -z 拉伸变形。
  sips -c "$TARGET_H" "$TARGET_W" --cropOffset 0 0 "$src" --out "$src" >/dev/null
done

cp "$ASSET_DIR/hero-record-${VERSION}-boy-source.png" "$HERO_BOY"
cp "$ASSET_DIR/hero-record-${VERSION}-girl-source.png" "$HERO_GIRL"

echo "Built record heroes ${VERSION}:"
ls -lh "$HERO_BOY" "$HERO_GIRL" "$ASSET_DIR"/hero-record-${VERSION}-*-source.png
