#!/usr/bin/env bash
# Invite friends page hero cover — homepage jelly monster style.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
PROFILE_REF="$ROOT/images/home/me-profile-header-monster-v2.png"
JELLY_CROP="$ROOT/assets/hero-pk-jelly-crop-ref.png"
IDENTITY="$ROOT/images/home/map/monsters/jelly-fighting.png"
OUT_DIR="$ROOT/images/invite"
ASSET_DIR="$ROOT/assets"
VERSION="v1"

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

BASE_STYLE="Polished 3D mobile-learning invite-friends hero card background, EXACT same Pixar-like render and bright sky style as me-profile-header-monster reference: vivid blue sky #4a9cf5 to #7cc3ff gradient, soft fluffy white clouds, golden sparkles. Wide mobile card banner ~6:5 landscape (1536×1280). NO text, NO watermark, NO UI chrome, NO buttons."

LAYOUT="LAYOUT FOR TEXT OVERLAY: entire LEFT 58% and LOWER-LEFT 75% kept as clean open sky and soft clouds only — absolutely NO monsters, NO props in left zone (Chinese slogan, invite code, and buttons will overlay here). Monsters grouped on RIGHT side and upper-right only."

INVITE_THEME="Invite-friends cheerful mood: TWO or THREE jelly monsters on the right in friendly welcoming poses — one waving hello, one holding a small glossy gift box with ribbon, optional tiny heart sparkles. Warm encouraging energy, NOT fighting, NOT VS, NOT angry. Subtle confetti or star sparkles near monsters only."

python3 "$COMPOSE" edit \
  -p "Invite friends page hero cover background plate. $BASE_STYLE $LAYOUT $INVITE_THEME $JELLY_IDENTITY Match color temperature and cloud softness of profile-header reference. Premium kids English-learning mini-program aesthetic." \
  -i "$PROFILE_REF" -i "$JELLY_CROP" -i "$IDENTITY" \
  -o "$ASSET_DIR/invite-hero-cover-${VERSION}-source.png" \
  --size 3840x2160 \
  --quality high

python3 - "$ASSET_DIR/invite-hero-cover-${VERSION}-source.png" "$OUT_DIR/invite-hero-cover.png" 1536 1280 <<'PY'
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
    top = max(0, (h - new_h) // 3)
    img = img.crop((0, top, w, top + new_h))
img = img.resize((bw, bh), Image.LANCZOS)
img.save(dst, optimize=True)
print("invite hero cover", dst, img.size)
PY

echo "Built invite hero cover:"
ls -lh "$OUT_DIR/invite-hero-cover.png" "$ASSET_DIR/invite-hero-cover-${VERSION}-source.png"
