# Checkin Plan Experience Design

## Goal

Make the checkin plan experience clear at three moments:

- Before saving a study plan, the learner understands what counts as a checkin.
- After finishing enough planned work, the learner sees that today's checkin succeeded.
- When a streak reward is locked or unlocked, the learner understands what happens next.

The design uses existing assets in `images/checkin`, especially the lightning, charge, and gift Jelly icons. No new visual asset pipeline is required.

## Scope

This is a small, connected experience across existing pages:

- `pages/plan/plan`: explain the daily checkin target and streak reward while the learner edits the study plan.
- `pages/finish/today`: show a checkin success state after the learner completes the daily goal.
- `pages/checkin/calendar`: make the `?` icon open checkin rules and improve the gift dialog states.

Out of scope:

- Backend reward issuance changes.
- New reward inventory screens.
- Manual checkin buttons.
- New image generation.

## User Experience

### Study Plan Page

Add a compact checkin commitment card below the plan result summary and above the level preview.

The card should say:

- Today's target is based on the selected groups per day.
- Completing that many levels automatically lights up today's checkin.
- A 30-day streak unlocks the current VIP gift.

When the learner changes `groupsPerDay`, the card updates immediately, for example: "每天完成 2 关即打卡". Saving still stores the same `studyPlan_<resBookId>` data, but the success feedback should be more explicit than the current plain toast.

### Finish Today Page

After `recordLevelDone` runs, compare today's completed count with `getDailyGoal`.

If the learner reaches the goal for the first time today, show a success block:

- Lightning/charge icon.
- Title: "打卡成功".
- Supporting copy: current daily completion and reward progress.
- Actions: continue learning and view checkin calendar.

If the learner has not reached the goal yet, keep the current finish experience with an added progress line such as "今日已完成 1/2 关".

If the learner already reached the goal earlier today, avoid repeating the large success moment. Show a quieter completed state.

### Checkin Calendar Page

Bind the existing `help.svg` icon to a rules dialog.

Rules dialog content:

- Complete today's planned levels to check in automatically.
- The plan target comes from the study plan page.
- Missing a day resets the continuous streak.
- A 30-day streak unlocks the VIP gift.

Improve the gift entry:

- Locked: tapping the gift shows how many days remain.
- Unlocked: tapping opens the gift dialog with the reward code.
- Copied: after copying, the primary button changes to "已复制" and a toast confirms the copy.

## Data Flow

Existing local progress remains the source for today's task state:

- `utils/checkin-progress.getDailyGoal(resBookId)` reads `studyPlan_<resBookId>`.
- `utils/checkin-progress.recordLevelDone(resBookId, unitId)` records unique completed units for today.
- `utils/checkin-progress.getTodayDone(resBookId)` returns today's local count.

The finish page can compute:

- `todayDoneBefore`
- `todayDoneAfter`
- `todayGoal`
- `justCheckedIn = todayDoneBefore < todayGoal && todayDoneAfter >= todayGoal`

The calendar page still uses backend user info for continuous days and reward code when available. If backend data is unavailable, it keeps the existing graceful fallback behavior.

## Components And State

No new reusable component is required for the first pass.

Page-local state additions:

- `pages/plan/plan`: display values for checkin target and reward copy can derive from existing data.
- `pages/finish/today`: `todayDone`, `todayGoal`, `justCheckedIn`, `checkinComplete`, `rewardRemainingDays`.
- `pages/checkin/calendar`: `showRulesDialog`, `giftCopied`, `rewardRemainingDays`.

Constants should stay local unless shared:

- `STREAK_REWARD_DAYS = 30`
- `STREAK_REWARD_CODE = 'TSZXVIP5D'`

## Error Handling

- If no book or `resBookId` exists, use the `default` progress key, matching current helper behavior.
- If `unitId` is missing, do not crash; the progress helper already tolerates empty IDs.
- If copying a reward code fails, keep the dialog open and show a neutral failure toast.
- If backend user info fails on the calendar page, keep the local calendar fallback and do not block rules or locked reward messaging.

## Testing

Add focused tests where the repo already has test coverage:

- `utils/checkin-progress`: confirm daily goal and completion counts still work with saved plans.
- Finish page behavior: goal not reached, first time reaching goal, already reached goal.
- Calendar page behavior: help dialog open/close, locked gift message, unlocked gift dialog, copy state.

Manual QA:

- Change groups per day on the plan page and verify the checkin card updates.
- Complete enough levels to hit today's goal and verify "打卡成功".
- Open the calendar rules dialog from `?`.
- Tap locked and unlocked gift states.
