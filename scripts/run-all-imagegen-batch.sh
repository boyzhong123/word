#!/usr/bin/env bash
# Run all image-compose / imagegen asset scripts with retries.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/assets/imagegen-batch-$(date +%Y%m%d-%H%M%S).log"
RETRIES=3
PAUSE=15

mkdir -p "$ROOT/assets"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

has_openai_key() {
  if [[ -n "${OPENAI_API_KEY:-}" ]]; then
    return 0
  fi
  python3 - <<'PY' 2>/dev/null
import json
from pathlib import Path
auth = Path.home()/'.codex'/'auth.json'
if not auth.exists():
    raise SystemExit(1)
data = json.loads(auth.read_text())
value = data.get('OPENAI_API_KEY') or ''
raise SystemExit(0 if isinstance(value, str) and value.startswith('sk-') else 1)
PY
}

run_step() {
  local name="$1"
  shift
  local attempt=1
  while (( attempt <= RETRIES )); do
    log "▶ $name (attempt $attempt/$RETRIES)"
    if "$@"; then
      log "✓ $name"
      return 0
    fi
    log "✗ $name failed"
    (( attempt++ ))
    sleep "$PAUSE"
  done
  log "!! SKIP after $RETRIES failures: $name"
  return 1
}

FAILED=()

run_or_fail() {
  local name="$1"
  shift
  if ! run_step "$name" "$@"; then
    FAILED+=("$name")
  fi
  sleep 8
}

log "=== imagegen batch start ==="

# Heroes (large, run first while API fresh)
run_or_fail "home-hero-trio" bash "$ROOT/scripts/generate-home-hero-trio.sh"
run_or_fail "growth-hero" bash "$ROOT/scripts/generate-growth-hero.sh"
run_or_fail "onboarding-intro-hero" bash "$ROOT/scripts/generate-onboarding-intro-hero.sh"
run_or_fail "invite-hero-cover" bash "$ROOT/scripts/generate-invite-hero-cover.sh"
run_or_fail "home-hero-record" bash "$ROOT/scripts/generate-home-hero-record.sh"
if has_openai_key; then
  run_or_fail "exam-entry-banners" bash "$ROOT/scripts/generate-exam-entry-banners.sh"
  run_or_fail "share-poster-bg" bash "$ROOT/scripts/generate-share-poster-bg.sh"
else
  log "⊘ skip exam-entry-banners / share-poster-bg (no usable OPENAI_API_KEY)"
fi
run_or_fail "invite-poster-bg" bash "$ROOT/scripts/generate-invite-poster-bg.sh"

# Today / home icons
run_or_fail "today-route-icon" bash "$ROOT/scripts/generate-today-route-icon.sh"
run_or_fail "today-summary-icon" bash "$ROOT/scripts/generate-today-summary-icon.sh"
run_or_fail "today-route-bar-icons" bash "$ROOT/scripts/generate-today-route-bar-icons.sh"
run_or_fail "onboarding-first-screen-icons" bash "$ROOT/scripts/generate-onboarding-first-screen-icons.sh"

# VIP / membership
run_or_fail "vip-step-icons" bash "$ROOT/scripts/generate-vip-step-icons.sh" all
run_or_fail "vip-name-badge" bash "$ROOT/scripts/generate-vip-name-badge.sh"
run_or_fail "vip-floating-banner" bash "$ROOT/scripts/generate-vip-floating-guide-banner.sh"
run_or_fail "vip-floating-unlock" bash "$ROOT/scripts/generate-vip-floating-unlock.sh"
run_or_fail "membership-records-empty" bash "$ROOT/scripts/generate-membership-records-empty.sh"

# Guide / listen / misc
run_or_fail "listen-guide-coach" bash "$ROOT/scripts/generate-listen-guide-coach-mascot.sh"
run_or_fail "listen-guide-gestures" bash "$ROOT/scripts/generate-listen-guide-gestures.sh"
run_or_fail "today-route-guide-mascot" bash "$ROOT/scripts/generate-today-route-guide-mascot.sh"
run_or_fail "toast-hint" bash "$ROOT/scripts/generate-toast-hint.sh"
run_or_fail "plan-mascot" bash "$ROOT/scripts/generate-plan-mascot.sh"
run_or_fail "finish-today-header" bash "$ROOT/scripts/generate-finish-today-header.sh"
run_or_fail "jelly-locked" bash "$ROOT/scripts/generate-jelly-locked.sh"
run_or_fail "jelly-defeated" bash "$ROOT/scripts/generate-jelly-defeated.sh"

# Codex imagegen (optional — needs usable OPENAI_API_KEY)
if has_openai_key; then
  run_or_fail "study-record-icons" bash "$ROOT/scripts/generate-study-record-icons.sh"
  run_or_fail "exam-report-icons" bash "$ROOT/scripts/generate-exam-report-icons.sh"
else
  log "⊘ skip study-record / exam-report (no OPENAI_API_KEY)"
fi

log "=== batch done ==="
if ((${#FAILED[@]})); then
  log "Failed (${#FAILED[@]}):"
  printf '  - %s\n' "${FAILED[@]}" | tee -a "$LOG"
  exit 1
fi
log "All steps succeeded. Log: $LOG"
exit 0
