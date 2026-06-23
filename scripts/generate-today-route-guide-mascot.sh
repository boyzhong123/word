#!/usr/bin/env bash
# Generate today-route guide coach mascot — sitting jelly monster like toast-hint.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO="$ROOT/images/home/hero-campus-jelly-v5.png"
TOAST_HINT="$ROOT/images/home/toast-hint.png"
USER_REF="$ROOT/assets/today-route-guide-mascot-user-ref.png"
OUT="$ROOT/assets/today-route-guide-mascot-source.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

if [[ ! -f "$HERO" || ! -f "$TOAST_HINT" ]]; then
  echo "missing references: hero=$HERO toast=$TOAST_HINT" >&2
  exit 1
fi

mkdir -p "$ROOT/assets"

# Optional user-provided reference saved by the chat attachment.
REF_ARGS=(-i "$HERO" -i "$TOAST_HINT")
if [[ -f "$USER_REF" ]]; then
  REF_ARGS+=(-i "$USER_REF")
fi

PROMPT="Today page learning-route guide coach mascot. Match the EXACT seated green jelly monster from the toast-hint reference: same translucent lime-green jelly slime body with tiny internal bubbles, glossy wet highlights, yellow ridged horns, pear-shaped sitting pose with short stubby legs forward, premium Pixar-like 3D mobile-learning mascot. Face must match toast-hint exactly: large round shiny black eyes with bright catchlights, thick dark green eyebrows, wide happy open smile with small upper teeth and pink tongue. NO round glasses, NO standing pose, NO index-finger pointing upward, NO sideways pointing. Guide pose only: seated comfortably, body leaning slightly forward with eager energy, BOTH stubby arms stretched forward with open palms in an inviting let's-start gesture (welcoming user to tap the learning task). Friendly excited coach expression. Do NOT include the floating exclamation badge from toast-hint. Single character centered. No boy, no girl, no campus, no text, no UI card, no floor shadow. Flat solid pure magenta background exactly #ff00ff with no gradient. CRITICAL FRAMING: character occupies at most 58% of canvas; leave at least 20% empty safe margin on every side; horns, feet, palms, and sitting base fully visible with no clipping. Square composition, crisp edges for mobile UI downscale."

python3 "$COMPOSE" edit \
  -p "$PROMPT" \
  "${REF_ARGS[@]}" \
  -o "$OUT" \
  --resize 1024

python3 "$ROOT/scripts/build-today-route-guide-mascot.py"

echo "Built today route guide mascot:"
ls -1 "$ROOT/images/home/today-route-guide-mascot.png"
