# Home Stage Stars Design

## Goal

Replace the numeric stage fraction in each home unit card with three small illustrated stars while preserving the existing stage completion meaning.

## Visual Design

- Display three stars in the current stage-progress position.
- A completed stage uses a warm golden filled star.
- An incomplete or locked stage uses a pale gray-white empty star.
- Both icons match the rounded, glossy children's illustration style used by the home page and mascots.
- Generate the source artwork with built-in ImageGen, then remove its flat chroma-key background to create transparent PNG assets.

## Data And Rendering

- Derive `stageStars` from the existing `doneStages` value as an array of three booleans.
- API units currently produce either zero or three completed stages.
- Fallback units retain their existing zero, one, and two-stage examples.
- Render each boolean as either `stage-star-filled.png` or `stage-star-empty.png`.

## Verification

- Unit tests verify the boolean star mapping.
- Integration tests verify three image stars replace the numeric fraction.
- Asset tests verify both star icons are transparent PNG files.
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
  assert.equal(unit.mascot, '../../images/home/mascot-progress.png')
  assert.equal(unit.mascotSprite, '../../images/home/mascot-progress-sprite.png')
  assert.equal(unit.mascotDuration, 2.4)
  assert.deepEqual(unit.stageStars, [true, true, true])
  assert.deepEqual(unit.tasks.map(task => [task.current, task.total, task.percent]), [
  assert.equal(unit.mascot, '../../images/home/mascot-alert.png')
  assert.equal(unit.mascotSprite, '../../images/home/mascot-alert-sprite.png')
  assert.equal(unit.mascotDuration, 2.4)
  assert.deepEqual(unit.stageStars, [false, false, false])
  assert.deepEqual(unit.tasks.map(task => [task.current, task.total, task.percent]), [
  assert.equal(unit.mascot, '../../images/home/mascot-sleep.png')
  assert.equal(unit.mascotSprite, '../../images/home/mascot-sleep-sprite.png')
  assert.equal(unit.mascotDuration, 3.2)
  assert.deepEqual(unit.stageStars, [false, false, false])
  assert.deepEqual(unit.tasks.map(task => [task.current, task.total, task.percent]), [
test('empty API data returns a cloned fallback list', () => {
  const fallback = [{
    unitId: 'fallback',
    levelWords: 36,
    doneStages: 2,
    tasks: [{ type: 'word', current: 1 }]
  }]
  assert.equal(units[0].sort, 1)
  assert.equal(units[0].title, '关卡 1 · 36词')
  assert.deepEqual(units[0].stageStars, [true, true, false])
  assert.equal(fallback[0].tasks[0].current, 1)
})
test('unit cards provide more vertical room for the mascot and tasks', () => {
  assert.match(homeStyle, /\.task-card\s*{[^}]*height:\s*100rpx/s)
})

test('unit stage progress renders three imagegen stars instead of a numeric fraction', () => {
  assert.match(homeTemplate, /class="unit-stage-stars"/)
  assert.match(homeTemplate, /wx:for="{{unit\.stageStars}}"/)
  assert.match(homeTemplate, /stage-star-filled\.png/)
  assert.match(homeTemplate, /stage-star-empty\.png/)
  assert.doesNotMatch(homeTemplate, /{{unit\.doneStages}}\/3/)
  assert.match(homeStyle, /\.unit-stage-star\s*{[^}]*width:\s*30rpx/s)
})

test('home page renders running mascot sprites with a static image fallback', () => {
const spriteNames = [
  'mascot-sleep-sprite.png'
]
const stageStarNames = [
  'stage-star-filled.png',
  'stage-star-empty.png'
]
for (const spriteName of spriteNames) {
  })
}

for (const stageStarName of stageStarNames) {
  test(stageStarName + ' is a transparent PNG icon', () => {
    const starPath = path.join(projectRoot, 'images/home', stageStarName)
    assert.equal(fs.existsSync(starPath), true, stageStarName + ' should exist')
    const header = fs.readFileSync(starPath)
    assert.equal(header.toString('ascii', 1, 4), 'PNG')
    assert.equal(header[25], 6, stageStarName + ' should use RGBA color type')
  })
}