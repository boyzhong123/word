#!/usr/bin/env bash
# Generate study record page icons via imagegen, then build PNG assets.
# Requires OPENAI_API_KEY (or Codex auth.json).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
IMAGE_GEN="$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py"
PROMPTS="$ROOT/tmp/imagegen/study-record-icon-prompts.jsonl"
OUT_DIR="$ROOT/assets"

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
  echo "OPENAI_API_KEY is required." >&2
  exit 1
fi

python3 "$IMAGE_GEN" generate-batch \
  --input "$PROMPTS" \
  --out-dir "$OUT_DIR" \
  --concurrency 2 \
  --force

python3 "$ROOT/scripts/build-study-record-assets.py" "$@"
