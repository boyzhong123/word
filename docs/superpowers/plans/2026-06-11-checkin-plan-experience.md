# Checkin Plan Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved checkin plan experience across the study plan, finish, and checkin calendar pages.

**Architecture:** Keep the feature page-local and reuse the existing `utils/checkin-progress` helper for today's goal and completed count. The plan page explains the rule, the finish page surfaces the success moment, and the calendar page owns rule and reward dialogs.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JS, existing local storage helpers, `node:test` assertions.

---

## File Structure

- Modify `pages/plan/plan.wxml`: add the checkin commitment card between the result summary and level preview.
- Modify `pages/plan/plan.wxss`: style the commitment card with existing warm plan-page styling and existing Jelly icons.
- Modify `pages/finish/today.js`: compute today's done/goal before and after recording the completed unit.
- Modify `pages/finish/today.wxml`: show progress copy and the success block with calendar action when the goal is reached.
- Modify `pages/finish/today.wxss`: style the success block without changing the all-book completion branch.
- Modify `pages/checkin/calendar.js`: add rules dialog state, locked reward remaining copy, gift copy state, and copy failure handling.
- Modify `pages/checkin/calendar.wxml`: bind the `?` icon, add rules dialog, and update the gift dialog button state.
- Modify `pages/checkin/calendar.wxss`: style the rules dialog and copied gift state.
- Modify `tests/checkin-calendar.test.js`: cover the calendar rule and reward UI contracts.
- Create `tests/checkin-plan-experience.test.js`: cover plan and finish page UI/logic contracts.

## Task 1: Lock Calendar Rules And Gift States

**Files:**
- Modify: `tests/checkin-calendar.test.js`
- Modify: `pages/checkin/calendar.js`
- Modify: `pages/checkin/calendar.wxml`
- Modify: `pages/checkin/calendar.wxss`

- [ ] **Step 1: Write failing calendar tests**

Add assertions requiring `bindtap="openRulesDialog"`, `showRulesDialog`, `giftCopied`, `rewardRemainingDays`, copied button copy, and copy failure handling in `tests/checkin-calendar.test.js`.

- [ ] **Step 2: Verify calendar tests fail**

Run: `node --test tests/checkin-calendar.test.js`

Expected: FAIL because the calendar page has no rules dialog or copied gift state.

- [ ] **Step 3: Implement calendar behavior**

Add page data fields `showRulesDialog`, `giftCopied`, and `rewardRemainingDays`. Implement `openRulesDialog`, `closeRulesDialog`, `getRewardRemainingDays`, update locked gift toast copy, reset copied state when opening the gift dialog, and add a `fail` branch to `wx.setClipboardData`.

- [ ] **Step 4: Implement calendar markup and styles**

Bind the help icon to `openRulesDialog`, add a rules modal using `showRulesDialog`, render the copied gift button text with `{{giftCopied ? '已复制' : '复制兑换码'}}`, and add styles for `.rules-dialog-*` and `.gift-dialog-copy-done`.

- [ ] **Step 5: Verify calendar tests pass**

Run: `node --test tests/checkin-calendar.test.js`

Expected: PASS.

## Task 2: Lock Plan Page Commitment Card

**Files:**
- Create: `tests/checkin-plan-experience.test.js`
- Modify: `pages/plan/plan.wxml`
- Modify: `pages/plan/plan.wxss`

- [ ] **Step 1: Write failing plan tests**

Create `tests/checkin-plan-experience.test.js` with assertions that the plan page includes "每天完成 {{groupsPerDay}} 关即打卡", "连续30天", `bolt-jelly.png`, `gift-jelly.png`, and commitment card styles.

- [ ] **Step 2: Verify plan tests fail**

Run: `node --test tests/checkin-plan-experience.test.js`

Expected: FAIL because the commitment card does not exist.

- [ ] **Step 3: Implement plan commitment card**

Add the commitment card after `.result-card`, using existing data bindings and existing `images/checkin/bolt-jelly.png` and `images/checkin/gift-jelly.png`.

- [ ] **Step 4: Style plan commitment card**

Add `.checkin-card`, `.checkin-card-row`, `.checkin-card-icon`, `.checkin-card-title`, `.checkin-card-copy`, and `.checkin-reward-pill` styles in `pages/plan/plan.wxss`.

- [ ] **Step 5: Verify plan tests pass**

Run: `node --test tests/checkin-plan-experience.test.js`

Expected: PASS for the plan assertions.

## Task 3: Lock Finish Page Checkin Success

**Files:**
- Modify: `tests/checkin-plan-experience.test.js`
- Modify: `pages/finish/today.js`
- Modify: `pages/finish/today.wxml`
- Modify: `pages/finish/today.wxss`

- [ ] **Step 1: Write failing finish tests**

Extend `tests/checkin-plan-experience.test.js` with assertions for `getTodayDone`, `getDailyGoal`, `justCheckedIn`, `checkinComplete`, `goCheckinCalendar`, "打卡成功", "今日已完成", and `charge-jelly.png`.

- [ ] **Step 2: Verify finish tests fail**

Run: `node --test tests/checkin-plan-experience.test.js`

Expected: FAIL because the finish page does not compute or render checkin success.

- [ ] **Step 3: Implement finish logic**

Import `getTodayDone` and `getDailyGoal`, compute before/after counts around `recordLevelDone`, set `todayDone`, `todayGoal`, `justCheckedIn`, `checkinComplete`, and `rewardRemainingDays`, and add `goCheckinCalendar`.

- [ ] **Step 4: Implement finish markup and styles**

Add a progress line and a success card to the non-all-book branch. Use `charge-jelly.png`, "打卡成功", "今日已完成 {{todayDone}}/{{todayGoal}} 关", and a "查看打卡日历" action.

- [ ] **Step 5: Verify finish tests pass**

Run: `node --test tests/checkin-plan-experience.test.js`

Expected: PASS.

## Task 4: Run Focused Verification

**Files:**
- No new files.

- [ ] **Step 1: Run focused tests**

Run: `node --test tests/checkin-calendar.test.js tests/checkin-plan-experience.test.js`

Expected: PASS.

- [ ] **Step 2: Inspect changed files**

Run: `git diff -- pages/plan/plan.wxml pages/plan/plan.wxss pages/finish/today.js pages/finish/today.wxml pages/finish/today.wxss pages/checkin/calendar.js pages/checkin/calendar.wxml pages/checkin/calendar.wxss tests/checkin-calendar.test.js tests/checkin-plan-experience.test.js`

Expected: Diff only contains the approved checkin experience.

- [ ] **Step 3: Stage and commit implementation**

Run: `git add docs/superpowers/plans/2026-06-11-checkin-plan-experience.md pages/plan/plan.wxml pages/plan/plan.wxss pages/finish/today.js pages/finish/today.wxml pages/finish/today.wxss pages/checkin/calendar.js pages/checkin/calendar.wxml pages/checkin/calendar.wxss tests/checkin-calendar.test.js tests/checkin-plan-experience.test.js && git commit -m "feat: add checkin plan experience"`

Expected: Commit succeeds without staging unrelated user changes.

## Self-Review

- Spec coverage: plan card, finish success, calendar rules, gift locked/unlocked/copied states, and focused tests are covered.
- Placeholder scan: no TBD/TODO/fill-in placeholders remain.
- Type consistency: page state names are `showRulesDialog`, `giftCopied`, `rewardRemainingDays`, `todayDone`, `todayGoal`, `justCheckedIn`, and `checkinComplete` throughout.
