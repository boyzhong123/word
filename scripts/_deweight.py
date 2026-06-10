#!/usr/bin/env python3
# One-off: gentle font-weight reduction for secondary text.
import re, sys

# file -> { selector : new_weight }
PLAN = {
  "pages/home/home.wxss": {
    ".hero-subtitle": "500",
    ".switch-book": "600",
    ".switch-icon": "600",
    ".checkin-calendar-button": "600",
    ".metric-icon": "600",
    ".plan-icon": "600",
    ".unit-review-badge": "600",
    ".subtitle-language-toggle": "600",
    ".trail-sign-words": "600",
    ".trail-node-label": "600",
    ".trail-node-current": "600",
    ".trail-monster-tag": "600",
  },
  "pages/practice/practice.wxss": {
    ".sub-title-1": "500",
    ".sub-title-2": "500",
    ".order": "600",
    ".wn-lang": "600",
    ".wn-foot-text": "600",
    ".wn-sec-badge": "600",
    ".wn-tip-no": "600",
  },
  "pages/plan/plan.wxss": {
    ".preset-label": "500",
    ".level-badge": "600",
    ".level-count": "500",
  },
  "pages/vip/vip.wxss": {
    ".vip-content2": "500",
    ".tip": "500",
  },
  "pages/finish/today.wxss": {
    ".periodical": "600",
    ".info": "500",
  },
  "pages/checkin/calendar.wxss": {
    ".power-copy": "600",
    ".weekday": "500",
  },
  "pages/listen/listen.wxss": {
    ".quiz-progress-count": "500",
    ".quiz-badge": "600",
    ".quiz-card-label": "500",
    ".quiz-result": "600",
    ".loop-label": "500",
  },
  "pages/catalogue/catalogue.wxss": {
    ".content": "500",
  },
  "components/searchbar/searchbar.wxss": {
    ".cagetgory-item": "500",
  },
}

def apply(path, mapping):
    with open(path) as f:
        lines = f.readlines()
    done = set()
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        # match a selector block opener: "<selector> {"
        m = re.match(r"^(.+?)\s*\{\s*$", stripped)
        if m and m.group(1) in mapping and m.group(1) not in done:
            sel = m.group(1)
            j = i + 1
            while j < len(lines) and lines[j].strip() != "}":
                if re.match(r"^\s*font-weight\s*:", lines[j]):
                    indent = re.match(r"^(\s*)", lines[j]).group(1)
                    lines[j] = f"{indent}font-weight: {mapping[sel]};\n"
                    done.add(sel)
                    break
                j += 1
        i += 1
    missing = set(mapping) - done
    if missing:
        print(f"  !! not applied in {path}: {sorted(missing)}")
    with open(path, "w") as f:
        f.writelines(lines)
    print(f"  {path}: {len(done)} changed")

for path, mapping in PLAN.items():
    apply(path, mapping)
print("done")
