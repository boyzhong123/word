#!/usr/bin/env bash
# Invite share poster backgrounds (3 themes) — 5:8 portrait, homepage jelly monster style.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
PROFILE_REF="$ROOT/images/home/me-profile-header-monster-v2.png"
JELLY_CROP="$ROOT/assets/hero-pk-jelly-crop-ref.png"
IDENTITY="$ROOT/images/home/map/monsters/jelly-fighting.png"
HERO_REF="$ROOT/images/home/hero-campus-jelly-v5.png"
OUT_DIR="$ROOT/images/invite"
ASSET_DIR="$ROOT/assets"
VERSION="v1"
TARGET_W=600
TARGET_H=960

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$PROFILE_REF" "$JELLY_CROP" "$IDENTITY"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

mkdir -p "$ASSET_DIR" "$OUT_DIR"

JELLY_IDENTITY="CRITICAL MONSTER IDENTITY: green jelly mascot MUST match profile-header and PK hero references exactly — translucent lime-green jelly slime with tiny internal bubbles and sparkles, glossy wet highlights, yellow ridged horns, pear-shaped stubby limbs. Face: large round WHITE eyeballs with dark green pupils, thick dark green eyebrows, wide mouth with red interior and small upper tooth. Same vivid saturated lime-green. NOT darker, NOT opaque, NOT redesigned."

BASE_STYLE="Polished 3D mobile-learning invite share poster background plate, EXACT same Pixar-like render as homepage jelly monsters. EXACT portrait 5:8 canvas (width:height = 5:8). Bright saturated blue sky gradient #1f6fd6 to #8ec8ff like invite poster. NO text, NO logos, NO watermark, NO UI chrome."

LAYOUT="COMPOSITION FOR TEXT OVERLAY: place ALL characters and focal props in UPPER 52% only. MIDDLE band (40%-68% height) soft open blue sky — minimal detail for semi-transparent stat chips. BOTTOM 32% clean smooth blue gradient only — NO characters, NO objects (white footer card overlays here). Avoid busy detail behind center-left where white Chinese text will appear."

crop_to_poster() {
  local src="$1"
  local dst="$2"
  python3 - "$src" "$dst" "$TARGET_W" "$TARGET_H" <<'PY'
import sys
from PIL import Image

src, dst, bw, bh = sys.argv[1:5]
bw, bh = int(bw), int(bh)
img = Image.open(src).convert("RGBA")
w, h = img.size
target_ratio = bw / bh
current_ratio = w / h
if current_ratio > target_ratio:
    new_w = int(h * target_ratio)
    left = (w - new_w) // 2
    img = img.crop((left, 0, left + new_w, h))
else:
    new_h = int(w / target_ratio)
    top = max(0, int((h - new_h) * 0.12))
    img = img.crop((0, top, w, top + new_h))
img = img.resize((bw, bh), Image.LANCZOS)
img.save(dst, optimize=True)
print("poster bg", dst, img.size)
PY
}

generate_one() {
  local id="$1"
  local prompt="$2"
  local source="$ASSET_DIR/invite-poster-bg-${id}-${VERSION}-source.png"
  local out="$OUT_DIR/invite-poster-bg-${id}.png"

  local refs=(-i "$PROFILE_REF" -i "$JELLY_CROP" -i "$IDENTITY")
  if [[ -f "$HERO_REF" ]]; then
    refs+=(-i "$HERO_REF")
  fi

  echo "== Generating invite poster bg: $id =="
  python3 "$COMPOSE" edit \
    -p "$prompt" \
    "${refs[@]}" \
    -o "$source" \
    --size 2160x3840 \
    --quality high

  crop_to_poster "$source" "$out"
}

generate_one gift \
  "Invite-friends poster background THEME GIFT. $BASE_STYLE $LAYOUT $JELLY_IDENTITY Scene: TWO cheerful jelly monsters on upper-right celebrating an invite — one waving hello, one hugging a glossy yellow gift box with red ribbon. Floating pink hearts, golden confetti, soft fluffy clouds. Warm inviting mood, NOT fighting."

generate_one study \
  "Invite-friends poster background THEME STUDY. $BASE_STYLE $LAYOUT $JELLY_IDENTITY Scene: ONE jelly mascot at a cute miniature study desk in upper-center-right — open blue star book, tiny pencil, glowing English flashcards floating (no readable text). Cozy learning nook with soft window light, bookshelf silhouette in far upper background. Encouraging study buddy mood."

generate_one campus \
  "Invite-friends poster background THEME CAMPUS. $BASE_STYLE $LAYOUT $JELLY_IDENTITY Scene: sunny campus like homepage hero — lush green lawn band in upper third, red-roof school and blue sky, ONE jelly mascot standing on grass upper-right holding blue star book and waving. Fluffy clouds, golden sparkles. Friendly team-learning mood, NOT VS, NOT battle."

echo "Built invite poster backgrounds:"
ls -lh "$OUT_DIR"/invite-poster-bg-*.png
