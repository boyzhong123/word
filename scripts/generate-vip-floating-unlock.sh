#!/usr/bin/env bash
# Generate VIP product-card art for 词句刷刷刷 membership purchase page.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
JELLY="$ROOT/images/home/toast-hint.png"
CURRENT="$ROOT/images/home/vip-floating-unlock.png"
OUT="$ROOT/assets/vip-floating-unlock-v4-source.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$JELLY" "$CURRENT"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

mkdir -p "$ROOT/assets"

PROMPT="Premium VIP membership product thumbnail for a Chinese word-and-sentence practice learning app called 词句刷刷刷. Match the EXACT jelly mascot identity from toast-hint reference: translucent lime-green jelly slime body with tiny bubbles, glossy highlights, yellow ridged horns, large shiny black eyes with bright catchlights, thick dark green eyebrows, wide happy smile with small upper teeth and pink tongue. NO glasses, NO human children. New premium composition themed around brushing words and sentences: the jelly mascot waves cheerfully on the left while floating cute 3D flashcards show a bold Chinese character 词 and 句, small golden checkmarks, sparkle stars, and a shiny open golden padlock with a VIP crown feeling. Add a few stacked golden coins and soft glowing particles. Warm premium gold-and-cream accents on a deep charcoal-to-warm-brown vignette background, polished mobile-game 3D illustration style like the current VIP unlock reference. Portrait composition, subject centered with breathing room, no text labels, no UI frame, no watermark. Crisp edges suitable for downscale into a small purchase-card thumbnail."

python3 "$COMPOSE" edit \
  -p "$PROMPT" \
  -i "$JELLY" \
  -i "$CURRENT" \
  --size 2160x3840 \
  -o "$OUT" \
  --resize 1536

python3 "$ROOT/scripts/build-vip-floating-unlock.py"

echo "Built VIP floating unlock art:"
ls -1 "$ROOT/images/home/vip-floating-unlock.png" "$ROOT/vercel-assets/images/home/vip-floating-unlock.png"
