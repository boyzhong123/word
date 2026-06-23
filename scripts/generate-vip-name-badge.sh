#!/usr/bin/env bash
# Generate inline VIP name badge for today/me profile headers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$HOME/.claude/skills/image-compose/compose.py"
BANNER="$ROOT/images/home/vip-floating-guide-banner.png"
ACTIVE_BADGE="$ROOT/images/home/vip-name-badge.png"
OUT_ACTIVE="$ROOT/assets/vip-name-badge-source.png"
OUT_INACTIVE="$ROOT/assets/vip-name-badge-inactive-source.png"
MODE="${1:-all}"

if [[ ! -f "$COMPOSE" ]]; then
  echo "missing image-compose CLI: $COMPOSE" >&2
  exit 1
fi

mkdir -p "$ROOT/assets"

generate_active() {
  if [[ ! -f "$BANNER" ]]; then
    echo "missing reference: $BANNER" >&2
    exit 1
  fi

  PROMPT="Tiny inline VIP membership badge icon for a Chinese kids word-learning app profile header. Single compact horizontal pill badge only, no mascot, no card, no banner. Match the golden VIP button style from the reference banner: soft yellow-to-gold gradient fill, thin darker gold border, subtle glossy 3D mobile UI polish, tiny sparkle highlights. Center text: VIP in bold dark brown sans-serif, all caps, crisp and readable at small size. Optional tiny minimal crown silhouette integrated into the left edge of the pill, very subtle. Rounded capsule shape, aspect ratio about 2.6:1 (wide and short). Flat solid pure magenta background exactly #ff00ff with no gradient. CRITICAL: badge occupies at most 45% of canvas width and 28% of canvas height; generous empty magenta margin on all sides; no clipping; no shadow on magenta background. Square composition for easy downscale."

  python3 "$COMPOSE" edit \
    -p "$PROMPT" \
    -i "$BANNER" \
    -o "$OUT_ACTIVE" \
    --resize 1024
}

generate_inactive() {
  if [[ ! -f "$ACTIVE_BADGE" ]]; then
    echo "missing active badge reference: $ACTIVE_BADGE" >&2
    exit 1
  fi

  PROMPT="Recolor this exact VIP badge into an inactive / not-yet-activated state for a kids learning app. Keep the SAME pill shape, crown icon, VIP lettering layout, proportions, and glossy 3D mobile UI style. Replace gold palette with muted cool grey: soft light-grey to medium-grey gradient fill, thin darker grey border, no sparkles, no shine highlights. Crown and VIP text in medium-dark grey, slightly desaturated, clearly readable but obviously inactive compared to gold premium version. Flat solid pure magenta background exactly #ff00ff with no gradient. CRITICAL: badge occupies at most 45% of canvas width and 28% of canvas height; generous empty magenta margin on all sides; no clipping."

  python3 "$COMPOSE" edit \
    -p "$PROMPT" \
    -i "$ACTIVE_BADGE" \
    -o "$OUT_INACTIVE" \
    --resize 1024
}

case "$MODE" in
  active)
    generate_active
    ;;
  inactive)
    generate_inactive
    ;;
  all)
    generate_active
    generate_inactive
    ;;
  *)
    echo "usage: $0 [active|inactive|all]" >&2
    exit 1
    ;;
esac

python3 "$ROOT/scripts/build-vip-name-badge.py"

echo "Built VIP name badges:"
ls -1 \
  "$ROOT/images/home/vip-name-badge.png" \
  "$ROOT/images/home/vip-name-badge-inactive.png" \
  "$ROOT/vercel-assets/images/home/vip-name-badge.png" \
  "$ROOT/vercel-assets/images/home/vip-name-badge-inactive.png"

