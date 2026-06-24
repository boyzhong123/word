# Retired Pages And Assets Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove unreachable legacy pages, their dead supporting code and exclusive image assets, plus disposable image-build artifacts.

**Architecture:** Treat `app.json` and production navigation calls as the route graph. Remove only pages with no production inbound edge and whose behavior has been replaced or disabled; then remove code and assets exclusively owned by those pages. Keep current membership, onboarding, today, and other in-progress work untouched.

**Tech Stack:** WeChat Mini Program, CommonJS JavaScript, Node.js built-in test runner.

---

### Task 1: Lock The Cleanup Boundary

**Files:**
- Create: `tests/repository-hygiene.test.js`

- [ ] **Step 1: Add a failing route hygiene test**

Assert that `pages/index/index`, `pages/advertisement/advertisement`, `pages/vip/vip`, and `pages/me/pet` are absent from `app.json`, their page files are absent, and production files no longer reference their routes or `utils/pet-system`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/repository-hygiene.test.js`

Expected: FAIL because the retired routes and files still exist.

### Task 2: Remove Retired Page Flows

**Files:**
- Modify: `app.json`
- Modify: `pages/finish/today.js`
- Modify: `pages/finish/today.wxml`
- Modify: `pages/finish/today.wxss`
- Modify: `utils/image-host.js`
- Modify: `tests/me-subpages.test.js`
- Modify: `tests/button-style.test.js`
- Modify: `scripts/capture-mini-app-screenshots.mjs`
- Modify: `scripts/_deweight.py`
- Delete: `pages/index/*`
- Delete: `pages/advertisement/*`
- Delete: `pages/vip/*`
- Delete: `pages/me/pet.*`
- Delete: `utils/pet-system.js`
- Delete: `tests/advertisement-sku.test.js`
- Delete: `tests/pet-system.test.js`

- [ ] **Step 1: Remove retired routes and page files**

Remove the four unreachable routes and their complete page implementations.

- [ ] **Step 2: Remove dead supporting behavior**

Remove the hidden pet reward calculation/UI, pet image-host entries, legacy screenshot targets, and obsolete test/style references.

- [ ] **Step 3: Run the hygiene test**

Run: `node --test tests/repository-hygiene.test.js`

Expected: PASS.

### Task 3: Remove Exclusive And Generated Images

**Files:**
- Delete: `images/pet/`
- Delete: `vercel-assets/images/pet/`
- Delete: `images/home/ad/`
- Delete: `vercel-assets/images/home/ad/`
- Delete: `assets/.debug/`
- Delete: `images/**/.build/`
- Delete: `images/**/.jelly-build/`
- Delete: untracked `images/home/map/monsters/debug-*.png`
- Delete: untracked `images/home/map/monsters/test-*.png`

- [ ] **Step 1: Delete page-exclusive image trees**

Remove runtime and CDN mirrors owned only by the retired advertisement and pet flows.

- [ ] **Step 2: Delete disposable build/debug outputs**

Remove debug renders and keyed intermediate images while retaining canonical source images and build scripts for active pages.

### Task 4: Verify The Repository

**Files:**
- Verify: `app.json`
- Verify: all `tests/*.test.js`

- [ ] **Step 1: Search for stale references**

Run: `rg -n "pages/(index/index|advertisement/advertisement|vip/vip|me/pet)|pet-system|images/pet/|images/home/ad/" --glob '!docs/**' --glob '!mockups/**' .`

Expected: no production or test references.

- [ ] **Step 2: Run all tests**

Run: `node --test tests/*.test.js`

Expected: all tests pass.

- [ ] **Step 3: Review the final diff and size reduction**

Run: `git status --short && du -sh assets images vercel-assets pages`

Expected: only intended removals and current pre-existing user changes remain.
