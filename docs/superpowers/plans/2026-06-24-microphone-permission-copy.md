# Microphone Permission Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the listen-guide microphone permission copy so it accurately describes the two-step authorization flow.

**Architecture:** Keep the existing permission and recording behavior unchanged. Add a template regression assertion, then replace only the three user-facing strings in the permission coach bubble.

**Tech Stack:** WeChat Mini Program WXML, Node.js built-in test runner

---

### Task 1: Update the microphone permission guide copy

**Files:**
- Modify: `tests/listen-guide.test.js`
- Modify: `pages/listen/listen.wxml:345`

- [ ] **Step 1: Write the failing test**

Read `pages/listen/listen.wxml` in `tests/listen-guide.test.js` and assert that it contains the approved title, explanation, and button label:

```js
test('microphone permission guide explains the system authorization step', () => {
  assert.match(listenTemplate, />跟读需要麦克风</)
  assert.match(listenTemplate, /需要录下你的发音进行评分。点击「继续」后，请在系统弹窗中选择「允许」。/)
  assert.match(listenTemplate, /catchtap="onListenGuidePermissionAllow">继续</)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/listen-guide.test.js`

Expected: FAIL because the WXML still contains the old title, explanation, and button label.

- [ ] **Step 3: Write minimal implementation**

Replace the permission guide strings with:

```xml
<view class="listen-guide-coach-title">跟读需要麦克风</view>
<view class="listen-guide-coach-sub">需要录下你的发音进行评分。点击「继续」后，请在系统弹窗中选择「允许」。</view>
<view class="listen-guide-coach-btn" catchtap="onListenGuidePermissionAllow">继续</view>
```

- [ ] **Step 4: Run focused and related tests**

Run: `node --test tests/listen-guide.test.js tests/listen-follow-read.test.js`

Expected: all tests pass.

- [ ] **Step 5: Review the diff**

Run: `git diff -- pages/listen/listen.wxml tests/listen-guide.test.js`

Expected: only the approved copy and its regression test are changed.
