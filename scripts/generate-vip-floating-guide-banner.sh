#!/usr/bin/env bash
# Generate VIP floating guide banner for today page.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
JELLY="$ROOT/images/home/toast-hint.png"
MASCOT="$ROOT/images/home/today-route-guide-mascot.png"
HERO="$ROOT/images/home/hero-campus-jelly-v5.png"
CURRENT="$ROOT/images/home/vip-floating-guide-banner.png"
STYLE_REF="$ROOT/assets/vip-floating-guide-banner-regen-v7-source.png"
OUT="$ROOT/assets/vip-floating-guide-banner-source.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$JELLY" "$MASCOT" "$HERO"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

STYLE_ARGS=()
if [[ -f "$STYLE_REF" ]]; then
  STYLE_ARGS+=(-i "$STYLE_REF")
fi

PROMPT="Premium Chinese kids English-learning mini-program VIP floating banner. ONE ultra-wide horizontal glass card centered in frame with generous empty margin above and below (so it can be center-cropped to 4.6:1). Match EXACT jelly mascot identity from toast-hint and today-route-guide-mascot: translucent lime-green jelly with bubbles, yellow ridged horns, shiny black eyes, thick dark green eyebrows, happy smile. Left: compact seated mascot bust inside soft mint glow circle, mascot only 58% of card height, not touching edges. Center: Chinese headline 解锁完整学习路径 bold dark green, subtitle 会员可学全部关卡，跟读评测和报告全开放 smaller grey-green, left-aligned and vertically centered. Right: elegant cream-gold outlined pill button 开通 VIP, vertically centered with text. Top-right: tiny circular close X. Style: refined light mint-to-cream gradient, thin gold border, subtle sparkles, clean premium mobile UI like top edtech apps. NOT chunky 3D, NOT dark shadow, NOT poster, NOT vertical card, NOT watermark. Entire card fully visible."

python3 "$COMPOSE" edit \
  -p "$PROMPT" \
  -i "$JELLY" \
  -i "$MASCOT" \
  -i "$HERO" \
  "${STYLE_ARGS[@]}" \
  --size 3840x2160 \
  --quality medium \
  -o "$OUT" \
  --resize 2000

python3 "$ROOT/scripts/build-vip-floating-guide-banner.py"

echo "Built VIP floating guide banner:"
ls -1 "$ROOT/images/home/vip-floating-guide-banner.png" "$ROOT/vercel-assets/images/home/vip-floating-guide-banner.png"
