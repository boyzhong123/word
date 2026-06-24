#!/usr/bin/env bash
# Onboarding intro hero: AI background + icons, then composite canonical Today jelly mascot.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
ASSET_DIR="$ROOT/assets"
OUT_DIR="$ROOT/images/onboarding"
ICON_LISTEN="$ROOT/images/home/icon-today-feature-listen.png"
ICON_READ="$ROOT/images/home/icon-today-feature-read.png"
ICON_RECITE="$ROOT/images/home/icon-today-feature-recite.png"
ICON_QUIZ="$ROOT/images/home/icon-today-feature-quiz.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$ICON_LISTEN" "$ICON_READ" "$ICON_RECITE" "$ICON_QUIZ"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

if [[ ! -f "$ROOT/images/home/today-route-guide-mascot.png" ]]; then
  echo "missing canonical mascot: images/home/today-route-guide-mascot.png" >&2
  exit 1
fi

mkdir -p "$ASSET_DIR" "$OUT_DIR"

SAFE_TOP="STATUS BAR SAFE ZONE: TOP 30% of banner is ONLY soft pastel sky gradient lavender #e7e1f0 to light blue #bcd0f8 with faint clouds — absolutely NO objects in top band."

BG_PROMPT="Onboarding welcome HERO background plate only, wide 2:1 landscape mobile banner. $SAFE_TOP LOWER 70%: leave LEFT 38% as soft empty mint-green glow with subtle bokeh — NO character, NO mascot, NO silhouette in left area (mascot added later). RIGHT 62%: four floating glossy 3D learning icons in playful upward arc with golden sparkle trails — orange headphones (listen), purple jelly microphone (read), blue textbook with yellow star (memorize), orange quiz card with green checkmark (test/review). Match today feature icon toy style from references. Soft sunny mint-to-cream gradient, gentle lens flare, premium kids learning app hero. NO text, NO watermark, NO human, NO monster, NO jelly character anywhere."

echo "== Generate background + icons (no mascot) =="
python3 "$COMPOSE" edit \
  -p "$BG_PROMPT" \
  -i "$ICON_LISTEN" -i "$ICON_READ" -i "$ICON_RECITE" -i "$ICON_QUIZ" \
  -o "$ASSET_DIR/onboard-intro-hero-bg-raw.png" \
  --size 3840x2160

python3 - "$ASSET_DIR/onboard-intro-hero-bg-raw.png" "$ASSET_DIR/onboard-intro-hero-bg-source.png" 1536 768 <<'PY'
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
print("banner bg", dst, img.size)
PY

echo "== Composite canonical Today jelly mascot =="
python3 "$ROOT/scripts/build-onboarding-intro-hero-composite.py"

echo "Built onboarding intro hero:"
ls -lh "$OUT_DIR/onboard-intro-hero.png"
