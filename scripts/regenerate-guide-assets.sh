#!/usr/bin/env bash
# Regenerate all newbie-guide image assets with safer framing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

bash "$ROOT/scripts/generate-vip-floating-guide-banner.sh"
bash "$ROOT/scripts/generate-listen-guide-coach-mascot.sh"
bash "$ROOT/scripts/generate-today-route-guide-mascot.sh"
bash "$ROOT/scripts/generate-listen-guide-gestures.sh"

echo "All guide assets regenerated."
