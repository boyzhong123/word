# Home Stage Stars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace each unit card's numeric stage fraction with three ImageGen-created progress stars.

**Architecture:** Keep `doneStages` as the source of truth and derive a three-boolean `stageStars` array in the home unit mapper. The WXML renders one transparent filled or empty star per boolean, using two reusable assets.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript, Node test runner, built-in ImageGen, Pillow.

---

### Task 1: Specify Star Progress Behavior

**Files:**
- Modify: `tests/home-units.test.js`
- Modify: `tests/home-page-integration.test.js`
- Modify: `tests/mascot-assets.test.js`

- [ ] Add assertions for three-boolean stage arrays, image-based star rendering, and transparent PNG assets.
- [ ] Run `node --test tests/home-units.test.js tests/home-page-integration.test.js tests/mascot-assets.test.js`.
- [ ] Confirm failures are caused by missing `stageStars`, markup, styles, and assets.

### Task 2: Generate Star Assets

**Files:**
- Create: `images/home/stage-star-filled.png`
- Create: `images/home/stage-star-empty.png`

- [ ] Generate a filled golden star and pale empty star on flat magenta with built-in ImageGen.
- [ ] Remove the chroma-key background and validate RGBA transparency.
- [ ] Run `node --test tests/mascot-assets.test.js`.

### Task 3: Render Star Progress

**Files:**
- Modify: `pages/home/home-units.js`
- Modify: `pages/home/home.js`
- Modify: `pages/home/home.wxml`
- Modify: `pages/home/home.wxss`

- [ ] Derive `stageStars` from `doneStages` for API and fallback units.
- [ ] Replace the fraction markup with three star images.
- [ ] Add compact star-row styling in the existing progress position.
- [ ] Run the focused home tests, then `node --test tests/*.test.js`.
