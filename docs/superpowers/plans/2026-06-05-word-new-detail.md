# Word New Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `单词新学` detail page with home-page-consistent styling and pronunciation tips.

**Architecture:** Reuse the existing `practice` data loading and swiper flow. Route home `word` tasks to `practice?taskType=word`, then branch the template for word-new mode while leaving recitation mode on the current layout.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JS, Node built-in test runner.

---

### Task 1: Add Red Tests

**Files:**
- Modify: `tests/home-page-integration.test.js`
- Create: `tests/practice-word-detail.test.js`

- [ ] Replace the current pending-word assertion with a navigation assertion for `taskType=word`.
- [ ] Add a template/style test that requires `发音技巧`, the three provided pronunciation tips, a bottom `下一题` button, and no `音节拆分` label.
- [ ] Run `node --test tests/home-page-integration.test.js tests/practice-word-detail.test.js` and confirm the new tests fail.

### Task 2: Enable Word Navigation

**Files:**
- Modify: `pages/home/home.js`

- [ ] Update `handleTaskTap` to allow `word` and `recitation`.
- [ ] Pass the selected task type into `navigateToPracticeUnit`.
- [ ] Append `taskType=<type>` to the practice URL.
- [ ] Run the home integration test and confirm it passes.

### Task 3: Render Word Detail Mode

**Files:**
- Modify: `pages/practice/practice.js`
- Modify: `pages/practice/practice.wxml`
- Modify: `pages/practice/practice.wxss`

- [ ] Add `taskType` data, `isWordNewMode`, and `pronunciationTips`.
- [ ] Set mode from route options during `onLoad`.
- [ ] Add a word-new WXML branch that uses existing word/proverb/audio data.
- [ ] Style the branch with home-page colors, rounded cards, stable spacing, and a fixed bottom button.
- [ ] Run the practice template test and confirm it passes.

### Task 4: Verify

**Files:**
- Check: `pages/home/home.js`
- Check: `pages/practice/practice.js`
- Check: `pages/practice/practice.wxml`
- Check: `pages/practice/practice.wxss`

- [ ] Run `node --check pages/home/home.js`.
- [ ] Run `node --check pages/practice/practice.js`.
- [ ] Run `node --test tests/home-page-integration.test.js tests/practice-word-detail.test.js`.
