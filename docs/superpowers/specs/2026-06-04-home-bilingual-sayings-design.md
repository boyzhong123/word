# Home Bilingual Sayings Design

## Goal

Show English learning sayings as the default subtitle on every home-page unit card, backed by at least 200 English-Chinese pairs, with a small language toggle beside each subtitle.

## Behavior

- Every unit receives an English saying and its Chinese translation based on unit sort order.
- English is the default visible language.
- A compact button sits beside each subtitle. It shows `中` while English is visible and `EN` while Chinese is visible.
- Tapping any language button switches every visible unit card together.
- Loading additional units keeps the currently selected language because language selection is page-level state.
- Language selection is not persisted after leaving or reopening the page.

## Structure

- `pages/home/learning-sayings.js` owns the bilingual content list.
- `pages/home/home-units.js` maps each unit to `subtitleEnglish`, `subtitleChinese`, and a default English `subtitle`.
- `pages/home/home.js` owns the page-level `subtitleLanguage` state and toggle handler.
- `pages/home/home.wxml` chooses the visible text and renders the toggle.
- `pages/home/home.wxss` keeps the subtitle and button compact so they do not overlap the mascot or stage stars.

## Validation

- The content list contains at least 200 unique English sayings.
- Every entry contains both English and Chinese text.
- Unit mapping rotates through the bilingual list.
- The page defaults to English and toggles between English and Chinese.
- Existing unit progress, mascot animation, and task interactions remain unchanged.
# Home Bilingual Sayings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add at least 200 bilingual learning sayings and a page-wide English-Chinese subtitle toggle to home unit cards.

**Architecture:** Store bilingual content in a focused data module, map both language variants onto each display unit, and let a single page-level language state control which variant WXML shows. Each card renders the same compact toggle so any card can switch all visible subtitles.

**Tech Stack:** WeChat Mini Program JavaScript, WXML, WXSS, Node test runner

---

### Task 1: Specify Bilingual Content And Toggle Behavior

**Files:**
- Create: `tests/learning-sayings.test.js`
- Modify: `tests/home-units.test.js`
- Modify: `tests/home-page-integration.test.js`

- [ ] Add a test requiring at least 200 unique English-Chinese content pairs.
- [ ] Add mapper assertions for English and Chinese subtitle fields.
- [ ] Add page assertions for default English, toggle behavior, markup, and styling.
- [ ] Run `node --test tests/learning-sayings.test.js tests/home-units.test.js tests/home-page-integration.test.js`.
- [ ] Confirm failures are caused by the missing content module and language toggle.

### Task 2: Add Bilingual Learning Sayings

**Files:**
- Create: `pages/home/learning-sayings.js`
- Modify: `pages/home/home-units.js`

- [ ] Add at least 200 concise, unique English sayings with Chinese translations.
- [ ] Map both language variants onto API and fallback units.
- [ ] Run `node --test tests/learning-sayings.test.js tests/home-units.test.js`.

### Task 3: Add The Page-Level Language Toggle

**Files:**
- Modify: `pages/home/home.js`
- Modify: `pages/home/home.wxml`
- Modify: `pages/home/home.wxss`

- [ ] Default the page language to English.
- [ ] Add a handler that toggles `en` and `zh`.
- [ ] Render the selected subtitle and compact toggle beside it.
- [ ] Add one-line overflow protection so long sayings do not overlap card artwork.
- [ ] Run focused tests, then `node --test tests/*.test.js`.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const sayingsPath = path.resolve(__dirname, '../pages/home/learning-sayings.js')

test('learning sayings contain at least 200 unique English-Chinese pairs', () => {
  assert.ok(fs.existsSync(sayingsPath), 'learning-sayings.js should exist')

  delete require.cache[sayingsPath]
  const sayings = require(sayingsPath)
  const englishSayings = sayings.map(saying => saying.english)

  assert.ok(Array.isArray(sayings))
  assert.ok(sayings.length >= 200)
  assert.equal(new Set(englishSayings).size, sayings.length)
  assert.ok(sayings.every(saying => (
    typeof saying.english === 'string' &&
    /^[\x20-\x7e]+$/.test(saying.english) &&
    /[.!?]$/.test(saying.english)
  )))
  assert.ok(sayings.every(saying => (
    typeof saying.chinese === 'string' &&
    /[\u4e00-\u9fff]/.test(saying.chinese)
  )))
})
test('different levels rotate through at least 200 bilingual learning sayings', () => {
  const units = buildDisplayUnits(Array.from({ length: 205 }, (_, index) => ({
    unitId: 'unit-' + (index + 1),
    sort: index + 1,
    wordTotal: 12
  })))

  assert.ok(new Set(units.map(unit => unit.subtitleEnglish)).size >= 200)
  assert.ok(units.every(unit => unit.subtitle === unit.subtitleEnglish))
  assert.ok(units.every(unit => /^[\x20-\x7e]+$/.test(unit.subtitleEnglish)))
  assert.ok(units.every(unit => /[\u4e00-\u9fff]/.test(unit.subtitleChinese)))
})
test('unit stage progress renders three imagegen stars instead of a numeric fraction', () => {
  assert.match(homeStyle, /\.unit-stage-star\s*{[^}]*width:\s*30rpx/s)
})

test('unit subtitles default to English and render a bilingual toggle', () => {
  assert.match(homeScript, /subtitleLanguage:\s*'en'/)
  assert.match(homeScript, /toggleSubtitleLanguage\(\)/)
  assert.match(homeTemplate, /class="unit-subtitle-row"/)
  assert.match(homeTemplate, /unit\.subtitleEnglish/)
  assert.match(homeTemplate, /unit\.subtitleChinese/)
  assert.match(homeTemplate, /catchtap="toggleSubtitleLanguage"/)
  assert.match(homeTemplate, /subtitleLanguage === 'en' \? '中' : 'EN'/)
  assert.match(homeStyle, /\.subtitle-language-toggle\s*{/)
})

test('home page renders 20 units initially and appends the remaining batches', () => {
  assert.equal(page.data.units.length, 45)
})

test('subtitle language toggle switches all unit cards between English and Chinese', () => {
  const { page } = loadHomePage()

  assert.equal(page.data.subtitleLanguage, 'en')
  page.toggleSubtitleLanguage()
  assert.equal(page.data.subtitleLanguage, 'zh')
  page.toggleSubtitleLanguage()
  assert.equal(page.data.subtitleLanguage, 'en')
})

test('locked recitation shows an unlock toast instead of navigating', () => {