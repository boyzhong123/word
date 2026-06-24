# Non-Member Level Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show non-members the same foldable later-level route cards as VIP users, while intercepting taps on the three learning tasks with the existing VIP purchase prompt.

**Architecture:** Keep visual availability separate from access permission in the Today route view model. Ordinary paid levels receive normal `upcoming` presentation data plus a `requiresVip` permission flag; `tapTask()` checks that flag before task-order logic. Review-level locking remains unchanged.

**Tech Stack:** WeChat Mini Program JavaScript/WXML/WXSS, Node.js built-in test runner.

---

## File Structure

- `pages/today/today.js`: Build normal-looking paid-level route data and enforce VIP access when a task is tapped.
- `pages/today/today.wxml`: Render all ordinary levels through the shared foldable/expanded route structure.
- `tests/app-launch.test.js`: Exercise Today route view-model generation, folding, VIP interception, and VIP navigation.

### Task 1: Add Regression Coverage for Non-Member Paid Levels

**Files:**
- Modify: `tests/app-launch.test.js`

- [ ] **Step 1: Extend the Today page test harness**

Add modal tracking and storage-backed membership support:

```js
const storage = {}
const calls = {
  navigateTo: [],
  showModal: []
}

global.wx = {
  getStorageSync: key => storage[key],
  setStorageSync: (key, value) => { storage[key] = value },
  navigateTo: options => calls.navigateTo.push(options),
  showModal: options => calls.showModal.push(options),
  switchTab: () => {},
  showToast: () => {}
}
```

- [ ] **Step 2: Write failing behavior tests**

Add tests that call `applyTargets()` with a free first level and a paid second level:

```js
test('non-member paid levels use the normal foldable route presentation', () => {
  const { page } = loadTodayPage()
  page.applyTargets(
    { resBookId: 'book-1', name: 'Book' },
    [
      buildRouteUnit(1, false),
      buildRouteUnit(2, true)
    ],
    2,
    0
  )

  const paidLevel = page.data.targetLevels[1]
  assert.equal(paidLevel.locked, false)
  assert.equal(paidLevel.requiresVip, true)
  assert.equal(paidLevel.levelState, 'upcoming')
  assert.equal(paidLevel.collapsible, true)
  assert.equal(paidLevel.expanded, false)
  assert.ok(paidLevel.tasks.every(task => task.stepState !== 'locked'))
})

test('non-member can expand a paid level but tapping a task prompts vip', () => {
  const { page, calls } = loadTodayPage()
  // apply the same two targets, toggle lv-2, then tap its word task
  assert.equal(page.data.targetLevels[1].expanded, true)
  assert.equal(calls.showModal.length, 1)
  assert.equal(calls.navigateTo.length, 0)
})

test('vip member tapping the same later-level task follows normal navigation', () => {
  const { page, calls, storage } = loadTodayPage()
  storage.membership = { tierId: 'y1', expireAt: Date.now() + 86400000 }
  // apply targets with an active word task and tap it
  assert.equal(calls.showModal.length, 0)
  assert.equal(calls.navigateTo.length, 1)
})
```

Also assert that the WXML no longer contains the ordinary locked-card branch:

```js
assert.doesNotMatch(todayTemplate, /<block wx:if="\{\{level\.locked\}\}">/)
assert.doesNotMatch(todayTemplate, /class="locked-card"/)
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
node --test tests/app-launch.test.js
```

Expected: the new tests fail because paid levels still have `locked: true`, task states are `locked`, and the template still renders `locked-card`.

### Task 2: Separate Paid Access from Route Presentation

**Files:**
- Modify: `pages/today/today.js`

- [ ] **Step 1: Add a presentation normalizer**

Add a helper beside `activateTasks()`:

```js
function presentPaidTasks(rawTasks) {
  return (Array.isArray(rawTasks) ? rawTasks : []).map(task => Object.assign({}, task, {
    mapState: Number(task.percent) >= 100
      ? 'completed'
      : (task.mapState === 'active' ? 'active' : 'upcoming')
  }))
}
```

- [ ] **Step 2: Build ordinary paid levels as normal upcoming cards**

Inside `applyTargets()`:

```js
const requiresVip = !unit.isReview && !reallyUnlocked && !isFreeTrial
const locked = unit.isReview ? !unlocked : false
```

Use `presentPaidTasks(rawTasks)` when `requiresVip` is true, keep review lock handling unchanged, and return:

```js
requiresVip,
locked: DEMO_TODAY_ROUTE ? false : locked
```

This ensures the later paid level computes `levelState: 'upcoming'`, remains collapsible, and has no locked task presentation.

- [ ] **Step 3: Gate concrete task taps before task-order checks**

At the start of `tapTask()` after locating the level:

```js
if (level.requiresVip && !getMembership().active) {
  promptVipPurchase(this.book || this.data.book)
  return
}
```

Keep the existing `level.locked` branch for review/progress locks.

- [ ] **Step 4: Run the focused tests and verify the JavaScript behavior passes**

Run:

```bash
node --test tests/app-launch.test.js
```

Expected: JavaScript behavior tests pass; template assertions remain failing until Task 3.

### Task 3: Unify the Today Route Template

**Files:**
- Modify: `pages/today/today.wxml`

- [ ] **Step 1: Remove the ordinary locked-card branch**

Delete the block beginning with:

```xml
<block wx:if="{{level.locked}}">
```

and make the collapsed condition the first branch:

```xml
<view
  wx:if="{{level.collapsible && !level.expanded}}"
  class="seg-fold seg-fold-{{level.levelState}}"
  data-key="{{level.key}}"
  bindtap="toggleLevel"
>
```

Keep the existing expanded `wx:else` branch and task cards unchanged.

- [ ] **Step 2: Remove the ordinary locked visual modifier**

Change the route wrapper to:

```xml
<view class="seg seg-{{level.levelState}}" wx:for="{{targetLevels}}" wx:for-item="level" wx:key="key">
```

- [ ] **Step 3: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/app-launch.test.js
```

Expected: all focused Today page tests pass.

### Task 4: Regression Verification

**Files:**
- Verify: `pages/today/today.js`
- Verify: `pages/today/today.wxml`
- Verify: `tests/app-launch.test.js`

- [ ] **Step 1: Run Today route and VIP-related tests**

Run:

```bash
node --test tests/app-launch.test.js tests/today-route-guide.test.js tests/vip-purchase.test.js tests/home-page-integration.test.js
```

Expected: zero failures.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
node --test tests/*.test.js
```

Expected: zero failures.

- [ ] **Step 3: Check patch integrity**

Run:

```bash
git diff --check
git diff -- pages/today/today.js pages/today/today.wxml tests/app-launch.test.js
```

Expected: no whitespace errors; diff is limited to the approved behavior and regression tests.
