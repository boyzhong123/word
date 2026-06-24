#!/usr/bin/env bash
# Generate listen-page guide coach mascot — homepage jelly style, new coach pose.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
HERO="$ROOT/images/home/hero-campus-jelly-v5.png"
TOAST_HINT="$ROOT/images/home/toast-hint.png"
OUT="$ROOT/assets/listen-guide-coach-mascot-source.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

for ref in "$HERO" "$TOAST_HINT"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

mkdir -p "$ROOT/assets"

PROMPT="Listen-page follow-read guide coach mascot. Match the EXACT homepage jelly monster identity from toast-hint reference: same translucent lime-green jelly slime body with tiny internal bubbles, glossy wet highlights, yellow ridged horns, premium Pixar-like 3D mobile-learning mascot. Face must match toast-hint exactly: large round shiny black eyes with bright catchlights, thick dark green eyebrows, wide happy open smile with small upper teeth and pink tongue. NO round glasses, NO white eyeglasses, NO microphone, NO cupped-ear listening pose, NO seated legs-forward pose. Coach guide pose for UI layout where mascot sits on the LEFT and speech bubble is on the RIGHT: compact upright jelly blob with soft wavy liquid bottom edge, body and face turned toward viewer's RIGHT. Right stubby arm extended with index finger clearly pointing to the right toward the speech bubble; left stubby arm bent with a small encouraging fist pump near chest. Cheerful coaching expression, eyes looking toward the right. Single character centered. No boy, no girl, no campus, no text, no UI card, no floor shadow. Flat solid pure magenta background exactly #ff00ff with no gradient. CRITICAL FRAMING: character occupies at most 58% of canvas; leave at least 20% empty safe margin on every side; horns, pointing finger, fists, and jelly base fully visible with no clipping. Square composition, crisp edges for mobile UI downscale."

python3 "$COMPOSE" edit \
  -p "$PROMPT" \
  -i "$HERO" \
  -i "$TOAST_HINT" \
  -o "$OUT" \
  --resize 1024

python3 "$ROOT/scripts/build-listen-guide-coach-mascot.py"

echo "Built listen guide coach mascot:"
ls -1 "$ROOT/images/listen/listen-guide-coach-mascot.png"
