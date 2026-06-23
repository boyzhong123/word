#!/usr/bin/env bash
# Regenerate onboarding banners — 2:1 strips with soft sky safe zone under status bar.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
OUT_DIR="$ROOT/images/onboarding"
ASSET_DIR="$ROOT/assets"
PK_HERO="$ROOT/assets/growth-hero-backup-20260623/hero-campus-jelly-v5.png"
JELLY_CROP="$ROOT/assets/hero-pk-jelly-crop-ref.png"
IDENTITY="$ROOT/images/home/map/monsters/jelly-fighting.png"
APP_LOGO="$ROOT/images/app-logo.png"
BANNER_W=1536
BANNER_H=768

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$PK_HERO" "$JELLY_CROP" "$IDENTITY" "$APP_LOGO"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

mkdir -p "$ASSET_DIR" "$OUT_DIR"

crop_banner() {
  python3 - "$1" "$2" "$BANNER_W" "$BANNER_H" <<'PY'
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
    top = max(0, h - new_h)
    img = img.crop((0, top, w, top + new_h))
img = img.resize((bw, bh), Image.LANCZOS)
img.save(dst)
print("banner", dst, img.size)
PY
}

JELLY_IDENTITY="CRITICAL MONSTER IDENTITY: exact same green jelly mascot as jelly-crop and PK hero references. Translucent lime-green jelly slime with tiny internal bubbles and sparkles, glossy wet highlights, yellow ridged horns, pear-shaped stubby limbs. Face must match exactly: large round WHITE eyeballs with dark green pupils and bright catchlights; thick dark green eyebrows; wide mouth with red/pink interior and small upper tooth."

SAFE_TOP="CRITICAL LAYOUT — STATUS BAR SAFE ZONE: deliver a wide 2:1 banner (1536×768). The TOP 28–32% of the frame must be ONLY soft pastel sky gradient (lavender #e7e1f0 to light blue #bcd0f8) with a few faint fluffy clouds and tiny sparkles — absolutely NO characters, buildings, signs, books, or props in this top band. Push ALL characters, scenery and props into the BOTTOM 68–72%. This top band is intentionally empty for mobile status bar overlay."

BANNER_STYLE="Wide horizontal 2:1 landscape mobile onboarding BANNER edge to edge. Soft pink-blue gradient sky like Chinese study app. Character and props spread across the lower band — large mascot on left or center-left, scenery extending to right edge. NO tiny centered subject on huge empty margins, NO square composition, NO watermark, NO text."

python3 "$COMPOSE" edit \
  -p "Onboarding welcome banner — extend reference scene taller with extra sky headroom. $SAFE_TOP $BANNER_STYLE $JELLY_IDENTITY Scene in lower band: jelly mascot waving hello on the left, holding blue vocabulary book with yellow star; on the right floating orange and light-blue rounded tiles (blank), tiny golden stars and small upward orange growth chart. Friendly welcoming mood. Match reference composition but recomposed vertically." \
  -i "$OUT_DIR/onboard-intro-hero.png" -i "$JELLY_CROP" -i "$PK_HERO" -i "$IDENTITY" \
  -o "$ASSET_DIR/onboard-intro-hero-raw.png" \
  --size 3840x2160

python3 "$COMPOSE" edit \
  -p "Onboarding grade-step banner — extend reference scene taller with extra sky headroom. $SAFE_TOP $BANNER_STYLE $JELLY_IDENTITY Scene in lower band: jelly mascot with yellow school backpack on the left, three wooden directional signposts with colorful arrow boards (orange, green, blue) stretching to the right. Small grass and flowers along bottom. Theme: choosing grade path. Match reference but recomposed vertically." \
  -i "$OUT_DIR/onboard-step-grade.png" -i "$JELLY_CROP" -i "$IDENTITY" \
  -o "$ASSET_DIR/onboard-step-grade-raw.png" \
  --size 3840x2160

python3 "$COMPOSE" edit \
  -p "Onboarding semester-step banner — extend reference scene taller with extra sky headroom. $SAFE_TOP $BANNER_STYLE $JELLY_IDENTITY Scene in lower band: jelly mascot thinking with stubby hand near chin on the left, large desk calendar on the right showing spring flowers on left page and autumn leaves on right page. Seasonal flowers and fallen leaves. Theme: first vs second semester. Match reference but recomposed vertically." \
  -i "$OUT_DIR/onboard-step-semester.png" -i "$JELLY_CROP" -i "$IDENTITY" \
  -o "$ASSET_DIR/onboard-step-semester-raw.png" \
  --size 3840x2160

python3 "$COMPOSE" edit \
  -p "Onboarding textbook-step banner — extend reference scene taller with extra sky headroom. $SAFE_TOP $BANNER_STYLE $JELLY_IDENTITY Scene in lower band: jelly mascot on the left pulling a blue textbook from a wide wooden bookshelf stretching across the banner, colorful books and a small globe on the right. Cozy study corner. Theme: picking textbook version. Match reference but recomposed vertically." \
  -i "$OUT_DIR/onboard-step-textbook.png" -i "$JELLY_CROP" -i "$IDENTITY" \
  -o "$ASSET_DIR/onboard-step-textbook-raw.png" \
  --size 3840x2160

for name in intro-hero step-grade step-semester step-textbook; do
  crop_banner "$ASSET_DIR/onboard-${name}-raw.png" "$ASSET_DIR/onboard-${name}-source.png"
done

cp "$ASSET_DIR/onboard-intro-hero-source.png" "$OUT_DIR/onboard-intro-hero.png"
cp "$ASSET_DIR/onboard-step-grade-source.png" "$OUT_DIR/onboard-step-grade.png"
cp "$ASSET_DIR/onboard-step-semester-source.png" "$OUT_DIR/onboard-step-semester.png"
cp "$ASSET_DIR/onboard-step-textbook-source.png" "$OUT_DIR/onboard-step-textbook.png"

echo "Built onboarding banners (${BANNER_W}x${BANNER_H}):"
ls -lh "$OUT_DIR"/*.png
