#!/usr/bin/env bash
# Generate home exam entry banners via imagegen edit, then build @2x PNGs.
# Requires OPENAI_API_KEY (or Codex auth.json).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
ASSETS_DIR="$ROOT/assets"

ENTRY_REF="$ROOT/tmp/imagegen/exam-entry-ref-green.png"
EXIT_LOCKED_REF="$ROOT/tmp/imagegen/exam-entry-ref-locked.png"
MASCOT_REF="$ROOT/images/home/mascot-report-jelly.png"
HERO_REF="$ROOT/images/home/hero-campus-jelly-v5.png"

GEN_SIZE="1536x1024"
MODEL="gpt-image-1.5"

if [[ ! -f "$IMAGE_GEN" ]]; then
  echo "missing imagegen CLI: $IMAGE_GEN" >&2
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" && -f "$CODEX_HOME/auth.json" ]]; then
  export OPENAI_API_KEY="$(
    CODEX_HOME="$CODEX_HOME" python3 - <<'PY'
import json
import os
from pathlib import Path

auth = Path(os.environ["CODEX_HOME"]) / "auth.json"
data = json.loads(auth.read_text(encoding="utf-8"))
print(data.get("OPENAI_API_KEY", ""))
PY
  )"
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is required for imagegen generation." >&2
  exit 1
fi

mkdir -p "$ROOT/tmp/imagegen"

# Keep stable local references for regeneration.
if [[ ! -f "$ENTRY_REF" ]]; then
  cp "/Users/zhong/.cursor/projects/Users-zhong-Downloads-proverbs/assets/________2026-06-15_17.15.12-b28bd905-99f6-4ab5-895e-94809be56489.png" "$ENTRY_REF"
fi
if [[ ! -f "$EXIT_LOCKED_REF" ]]; then
  cp "/Users/zhong/.cursor/projects/Users-zhong-Downloads-proverbs/assets/image-c35601be-e730-4043-bac3-4f05cf731ff0.png" "$EXIT_LOCKED_REF"
fi

COMMON_STYLE="Match the polished 3D mobile-learning homepage header style from the hero reference: bright saturated colors, soft studio lighting, premium toy-like rendering, rounded friendly shapes, clean modern Chinese study-app UI. Keep the exact horizontal banner card layout from the card reference: left mascot icon, center title with small pill badge and subtitle, right rounded CTA button. Use crisp, legible Simplified Chinese text exactly as specified. Place one wide rounded rectangle card centered in the frame, occupying most of the width with comfortable side margins. No extra labels, no watermark, no outer margin beyond the card, plain light background outside the card."

generate_banner() {
  local out="$1"
  local card_ref="$2"
  local prompt="$3"
  python3 "$IMAGE_GEN" edit \
    --model "$MODEL" \
    --image "$card_ref" \
    --image "$MASCOT_REF" \
    --image "$HERO_REF" \
    --input-fidelity high \
    --background opaque \
    --output-format png \
    --size "$GEN_SIZE" \
    --quality high \
    --no-augment \
    --prompt "$prompt" \
    --out "$out" \
    --force
}

COMMON_CARD_LAYOUT="CRITICAL LAYOUT: one single horizontal UI list-row card filling a 4:1 landscape strip edge to edge. Every element vertically centered on the same midline. LEFT mascot, CENTER title+badge+subtitle, RIGHT white capsule CTA button vertically centered (NOT bottom-aligned, NOT touching bottom edge). Compact card only, no tall poster, no campus scene, no floor or horizon."

generate_banner \
  "$ASSETS_DIR/exam-entry-banner-entry-source.png" \
  "$ENTRY_REF" \
  "Redesign this entry-test banner card. $COMMON_CARD_LAYOUT $COMMON_STYLE Background: rich green gradient (#16a34a to #0f9d58) with subtle quiz motifs. Left: homepage-style jelly monster holding quiz clipboard and pencil. Title: 入门测. Badge: 摸底. Subtitle: 开学前测一测，了解你的当前水平. Right button: white pill, green text 测验, vertically centered."

generate_banner \
  "$ASSETS_DIR/exam-entry-banner-exit-source.png" \
  "$ENTRY_REF" \
  "Redesign as unlocked graduation-test banner. $COMMON_CARD_LAYOUT $COMMON_STYLE Background: vivid blue gradient (#2f80ed to #1f6fe0) with quiz answer sheet accents. Left: jelly monster with graduation cap holding completed quiz sheet with checkmarks. Title: 结业测. Badge: 通关. Subtitle: 检验整本书的学习成果，并与入门测对比. Right button: white pill, blue text 测验, vertically centered."

generate_banner \
  "$ASSETS_DIR/exam-entry-banner-exit-locked-source.png" \
  "$EXIT_LOCKED_REF" \
  "Redesign this locked graduation-test quiz banner in the same polished 3D quiz-card family as the hero reference, but clearly disabled. $COMMON_CARD_LAYOUT $COMMON_STYLE Background: soft desaturated blue-gray gradient (#d8dee8 to #c8d0dc) with very faint quiz watermark icons at low opacity. Left: grayed/desaturated jelly monster from hero reference wearing graduation cap and holding clipboard, with small cute padlock badge on chest (NOT flat line-art padlock icon alone). Title: 结业测 in dark gray-blue. Badge pill: 通关 in muted gray. Subtitle: 通关全部关卡且每关至少 2 星后解锁. Right button: disabled gray pill with white text 未解锁, vertically centered. Still feels like a quiz card, just locked."

python3 "$ROOT/scripts/build-exam-entry-banner-assets.py"

echo
echo "Built exam entry banners:"
ls -1 "$ROOT/images/home"/exam-entry-banner-*.png
