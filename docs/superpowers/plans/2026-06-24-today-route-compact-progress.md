# Today Route Compact Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the “更新时间” subtitle with a compact, labeled learning-progress bar and remove the separate progress row below the header.

**Architecture:** Reuse the existing `doneSteps`, `totalSteps`, and `stepPercent` page data. Change only the Today page template and styles; the business logic and progress calculation remain unchanged.

**Tech Stack:** WeChat Mini Program WXML/WXSS, Node.js built-in test runner

---

### Task 1: Lock the compact progress markup with a failing regression test

**Files:**
- Modify: `tests/app-launch.test.js:118`
- Test: `tests/app-launch.test.js`

- [ ] **Step 1: Replace the old update-time assertion with compact-progress assertions**

```js
assert.doesNotMatch(todayTemplate, /更新时间 \{\{routeUpdatedAtText\}\}/)
assert.match(todayTemplate, /class="route-progress"/)
assert.match(todayTemplate, /class="route-progress-fill" style="width: \{\{stepPercent\}\}%/ )
assert.match(todayTemplate, /\{\{doneSteps\}\}\/\{\{totalSteps\}\}/)
assert.doesNotMatch(todayTemplate, /class="route-bar-row"/)
```

- [ ] **Step 2: Run the focused test and verify it fails for the missing compact markup**

Run: `node --test tests/app-launch.test.js`

Expected: FAIL because the template still contains the update time and does not contain `.route-progress`.

### Task 2: Implement the confirmed B layout

**Files:**
- Modify: `pages/today/today.wxml:192-211`
- Modify: `pages/today/today.wxss:1212-1282`
- Test: `tests/app-launch.test.js`

- [ ] **Step 1: Replace the subtitle and old progress row in WXML**

```xml
<view class="route-progress">
  <view class="route-progress-track">
    <view class="route-progress-fill" style="width: {{stepPercent}}%;"></view>
  </view>
  <text class="route-progress-text">{{doneSteps}}/{{totalSteps}}</text>
</view>
```

Delete the `.route-bar-row` block, including the whistle and flag images.

- [ ] **Step 2: Replace old progress-row styles with compact header styles**

```css
.route-progress {
  margin-top: 8rpx;
  width: 236rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.route-progress-track {
  flex: 1;
  min-width: 0;
  height: 10rpx;
  border-radius: 999rpx;
  background: #e8ecef;
  overflow: hidden;
}
.route-progress-fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #34d27b 0%, #22c55e 100%);
  box-shadow: 0 0 8rpx rgba(34, 197, 94, 0.28);
  transition: width 0.4s ease;
}
.route-progress-text {
  flex: none;
  color: #168f3a;
  font-size: 20rpx;
  line-height: 26rpx;
  font-weight: 700;
}
```

Delete `.route-sub`, `.route-bar-row`, `.route-bar-whistle`, `.route-bar`, `.route-bar-fill`, and `.route-bar-flag`.

- [ ] **Step 3: Run the focused test and verify it passes**

Run: `node --test tests/app-launch.test.js`

Expected: PASS with zero failures.

### Task 3: Verify the Today page change

**Files:**
- Verify: `pages/today/today.wxml`
- Verify: `pages/today/today.wxss`
- Verify: `tests/app-launch.test.js`

- [ ] **Step 1: Check whitespace and inspect the scoped diff**

Run: `git diff --check -- pages/today/today.wxml pages/today/today.wxss tests/app-launch.test.js`

Expected: exit code 0.

Run: `git diff -- pages/today/today.wxml pages/today/today.wxss tests/app-launch.test.js`

Expected: only the compact progress markup, styles, and matching regression assertions differ for this feature.

- [ ] **Step 2: Run Today-page-related tests**

Run: `node --test tests/app-launch.test.js tests/home-page-integration.test.js`

Expected: all tests pass with zero failures.
