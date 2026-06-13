# Purchased Books Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `pages/me/book` into a purchased-textbooks list page using the approved lightweight asset-page layout.

**Architecture:** Keep the feature inside the existing WeChat mini program page files. `book.js` normalizes and filters the user-owned books, `book.wxml` renders a summary strip plus purchased list, and `book.wxss` owns the visual treatment.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JS, Node built-in test runner for text-level page assertions.

---

### Task 1: Assert Purchased-List Semantics

**Files:**
- Modify: `tests/me-subpages.test.js`

- [ ] **Step 1: Write the failing test**

Replace the book page expectations with assertions that the page includes purchased-list language and excludes the old dashboard language:

```js
assert.match(bookPage, /已购买/)
assert.match(bookPage, /继续学习/)
assert.match(bookPage, /bindtap="continueStudy"/)
assert.doesNotMatch(bookPage, /学习进度/)
assert.doesNotMatch(bookPage, /切换教材/)
assert.doesNotMatch(bookPage, /解锁/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/me-subpages.test.js`
Expected: FAIL because the current WXML still contains `学习进度`, `切换教材`, and `解锁`.

### Task 2: Implement Purchased Books Page

**Files:**
- Modify: `pages/me/book.js`
- Modify: `pages/me/book.wxml`
- Modify: `pages/me/book.wxss`

- [ ] **Step 1: Update data normalization**

Filter normalized books so locked/unpurchased books are excluded from `books`. Keep the current book selected from the purchased list, and expose `summary.bookCount`.

- [ ] **Step 2: Update page actions**

Rename the top action to `continueStudy`, keep `switchBook` for owned books only, and keep `openCatalogue` as a row-level secondary action.

- [ ] **Step 3: Update WXML**

Render loading and empty states, then a summary strip followed by the `已购买` list. Remove hero progress card, `学习进度`, `切换教材`, and `解锁`.

- [ ] **Step 4: Update WXSS**

Replace the old dashboard styling with the approved B layout: compact black summary strip, white book rows, current badge, and responsive fixed row dimensions.

### Task 3: Verify

- [ ] **Step 1: Run targeted tests**

Run: `node --test tests/me-subpages.test.js`
Expected: PASS.

- [ ] **Step 2: Run related page tests if available**

Run: `node --test tests/me-page-simplified.test.js tests/home-page-integration.test.js`
Expected: PASS or unrelated failures only.
