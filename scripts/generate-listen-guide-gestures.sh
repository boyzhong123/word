#!/usr/bin/env bash
# Generate listen-page guide gesture icons (tap finger, swipe hand, chevrons).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
FINGER_REF="$ROOT/images/listen/listen-guide-tap-finger.png"
SWIPE_REF="$ROOT/images/listen/listen-guide-swipe-hand.png"
CHEV_REF="$ROOT/images/listen/listen-guide-swipe-chevrons-white.png"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

mkdir -p "$ROOT/assets"

FRAMING="CRITICAL FRAMING: subject occupies at most 58% of canvas. Leave at least 20% empty safe margin on every side. No body parts, arrow tips, or chevron edges touching or crossing the image border. Centered composition."

PROMPT_FINGER="Mobile UI tutorial tap gesture icon. Cute soft 3D cartoon right hand in warm peach skin tone, index finger pointing straight down, other fingers curled. Matte clay-like style with soft top-left lighting. FULL hand visible including wrist cuff and fingertip, both well inside frame with generous padding above wrist and below fingertip. Single icon centered. No text. Flat solid pure magenta background exactly #ff00ff. Square composition. ${FRAMING}"

PROMPT_SWIPE="Mobile UI tutorial swipe-left gesture icon. Cute soft 3D cartoon hand in warm peach skin tone with index finger extended, other fingers curled. Thick curved light-blue arrow arcing over the hand pointing left to indicate swipe direction. Clean minimal game-tutorial style. Entire hand and entire arrow fully visible with wide margin on all sides, arrow tips not clipped. Single icon centered. No text. Flat solid pure magenta background exactly #ff00ff. Square composition. ${FRAMING}"

PROMPT_CHEV="Mobile UI swipe-left chevron indicator icon. Three nested white rounded chevrons pointing left, bold friendly stroke, soft glow. Icon group centered and small enough to leave wide magenta margin on all sides. No hand, no text. Flat solid pure magenta background exactly #ff00ff. Square composition. ${FRAMING}"

python3 "$COMPOSE" edit \
  -p "$PROMPT_FINGER" \
  -i "$FINGER_REF" \
  -o "$ROOT/assets/listen-guide-tap-finger-source.png" \
  --resize 1024

python3 "$COMPOSE" edit \
  -p "$PROMPT_SWIPE" \
  -i "$SWIPE_REF" \
  -o "$ROOT/assets/listen-guide-swipe-hand-source.png" \
  --resize 1024

python3 "$COMPOSE" edit \
  -p "$PROMPT_CHEV" \
  -i "$CHEV_REF" \
  -o "$ROOT/assets/listen-guide-swipe-chevrons-white-source.png" \
  --resize 1024

python3 "$ROOT/scripts/build-listen-guide-gestures.py"

echo "Built listen guide gesture icons:"
ls -1 "$ROOT/images/listen/listen-guide-tap-finger.png" \
  "$ROOT/images/listen/listen-guide-swipe-hand.png" \
  "$ROOT/images/listen/listen-guide-swipe-chevrons-white.png"
