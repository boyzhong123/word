# Word New Detail Design

## Goal

When a learner taps `单词新学` on the home page, open a word-focused learning detail screen whose visual language matches the updated home page.

## Scope

- Enable the `word` task type in `pages/home/home.js`.
- Keep `recitation` behavior working through the existing practice flow.
- Render a new `word` mode in `pages/practice/practice.wxml`.
- Replace the middle phonics/syllable split area with `发音技巧`.

## Experience

The detail screen uses the home page palette: warm page background, white rounded cards, green and blue accents, and a large bottom primary button. The top word section shows the word, phonetic symbol, translation, and audio/score controls. The middle card shows three pronunciation tips:

1. 先发 /æ/ 音，嘴巴张大，舌尖抵下齿背
2. 接着发 /p/ 音，双唇紧闭后突然张开送气
3. 最后发 /l/ 音，舌尖抵住上齿龈，气流从舌头两侧流出

## Testing

Node tests assert that the home page allows `word` navigation and that the practice template/style exposes the new `发音技巧` UI while removing the old phonics split label from the new mode.
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
test('word tasks navigate to the word new detail mode', () => {
  const { page, calls } = loadHomePage()
  page.data.book = { resBookId: 'book-1', name: 'Book Name' }
  page.data.units = [{ unitId: 'unit-word', locked: false }]

  page.handleTaskTap({
    currentTarget: {
      }
    }
  })

  assert.equal(calls.showToast.length, 0)
  assert.match(calls.navigateTo[0].url, /resBookId=book-1/)
  assert.match(calls.navigateTo[0].url, /unitId=unit-word/)
  assert.match(calls.navigateTo[0].url, /taskType=word/)
})
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const practiceScript = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.js'), 'utf8')
const practiceTemplate = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.wxml'), 'utf8')
const practiceStyle = fs.readFileSync(path.join(projectRoot, 'pages/practice/practice.wxss'), 'utf8')

test('practice page exposes a word-new mode driven by the task type route option', () => {
  assert.match(practiceScript, /taskType:\s*'recitation'/)
  assert.match(practiceScript, /isWordNewMode/)
  assert.match(practiceScript, /options\.taskType === 'word'/)
})

test('word-new detail replaces the phonics split block with pronunciation tips', () => {
  assert.match(practiceTemplate, /wx:if="{{isWordNewMode}}"/)
  assert.match(practiceTemplate, /发音技巧/)
  assert.match(practiceTemplate, /先发 \/æ\/ 音/)
  assert.match(practiceTemplate, /接着发 \/p\/ 音/)
  assert.match(practiceTemplate, /最后发 \/l\/ 音/)
  assert.match(practiceTemplate, /下一题/)
  assert.doesNotMatch(practiceTemplate, /音节拆分/)
})

test('word-new detail styling follows the rounded home card visual language', () => {
  assert.match(practiceStyle, /\.word-new-page\s*{[^}]*background:\s*#fffdf8/s)
  assert.match(practiceStyle, /\.word-new-card\s*{[^}]*border-radius:\s*29rpx/s)
  assert.match(practiceStyle, /\.pronunciation-card\s*{[^}]*background:\s*#ffffff/s)
  assert.match(practiceStyle, /\.word-next-button\s*{[^}]*background:\s*linear-gradient\(180deg,\s*#176cf0,\s*#3158ee\)/s)
})