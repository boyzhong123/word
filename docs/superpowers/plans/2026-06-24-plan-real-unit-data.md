# 学习计划真实关卡数据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让学习计划页的一组对应一个真实关卡，并用真实关卡数量与词数计算每日词数、预计天数和预计周数。

**Architecture:** 把纯计算逻辑提取到 `utils/plan-stats.js`，以真实关卡列表作为唯一优先输入，便于 Node 测试。`pages/plan/plan.js` 负责请求关卡、切换加载状态、更新页面和保存结果；仅当接口没有关卡时继续使用现有固定 10 词兜底列表。

**Tech Stack:** 微信小程序 JavaScript/WXML、CommonJS、Node.js 内置测试运行器 `node:test`

---

## File Structure

- Create `utils/plan-stats.js`: 真实关卡统计的纯函数，包括关卡词数、每日词数、总关卡数、预计天数和组数上限。
- Create `tests/plan-stats.test.js`: 覆盖真实关卡词数、不同组数、空列表和组数边界。
- Modify `pages/plan/plan.js`: 用加载后的真实关卡列表刷新统计，删除固定 10 词的主路径计算。
- Modify `pages/plan/plan.wxml`: 加载完成后展示真实每日词数；加载中不展示伪造统计。
- Modify `tests/checkin-plan-experience.test.js`: 保留打卡文案断言，并增加页面绑定真实统计状态的集成断言。

### Task 1: 建立真实关卡统计纯函数

**Files:**
- Create: `tests/plan-stats.test.js`
- Create: `utils/plan-stats.js`

- [ ] **Step 1: 写失败测试**

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const {
  computePlanStats,
  getMaxGroups
} = require('../utils/plan-stats')

const levels = [
  { count: 12 },
  { count: 15 },
  { count: 9 }
]

test('one group uses the first real level word count', () => {
  assert.deepEqual(computePlanStats(levels, 1), {
    dailyWords: 12,
    totalLevels: 3,
    estimatedDays: 3,
    estimatedWeeks: 1
  })
})

test('two groups sum two real levels instead of multiplying a fixed size', () => {
  assert.equal(computePlanStats(levels, 2).dailyWords, 27)
  assert.equal(computePlanStats(levels, 2).estimatedDays, 2)
})

test('group limit does not exceed real level count or product cap', () => {
  assert.equal(getMaxGroups(levels, 8), 3)
  assert.equal(getMaxGroups(Array.from({ length: 12 }, () => ({ count: 10 })), 8), 8)
})

test('empty levels return an unloaded zero state', () => {
  assert.deepEqual(computePlanStats([], 1), {
    dailyWords: 0,
    totalLevels: 0,
    estimatedDays: 0,
    estimatedWeeks: 0
  })
})
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test tests/plan-stats.test.js`

Expected: FAIL，提示无法找到 `../utils/plan-stats`。

- [ ] **Step 3: 写最小实现**

```js
function toPositiveInt(value, fallback = 0) {
  const number = Math.floor(Number(value))
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function getLevelWordCount(level) {
  return toPositiveInt(level && (level.count || level.wordTotal || level.levelWords), 0)
}

function computePlanStats(levels, groupsPerDay) {
  const list = Array.isArray(levels) ? levels : []
  const groups = Math.max(1, toPositiveInt(groupsPerDay, 1))
  const totalLevels = list.length
  const dailyWords = list
    .slice(0, groups)
    .reduce((total, level) => total + getLevelWordCount(level), 0)
  const estimatedDays = totalLevels ? Math.ceil(totalLevels / groups) : 0

  return {
    dailyWords,
    totalLevels,
    estimatedDays,
    estimatedWeeks: estimatedDays ? Math.ceil(estimatedDays / 7) : 0
  }
}

function getMaxGroups(levels, cap) {
  const totalLevels = Array.isArray(levels) ? levels.length : 0
  return Math.max(1, Math.min(toPositiveInt(cap, 1), Math.max(totalLevels, 1)))
}

module.exports = {
  computePlanStats,
  getLevelWordCount,
  getMaxGroups
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --test tests/plan-stats.test.js`

Expected: 4 tests PASS，0 FAIL。

- [ ] **Step 5: 提交纯函数与测试**

```bash
git add utils/plan-stats.js tests/plan-stats.test.js
git commit -m "test: define real unit plan calculations"
```

### Task 2: 学习计划页切换到真实关卡统计

**Files:**
- Modify: `pages/plan/plan.js`
- Modify: `pages/plan/plan.wxml`
- Modify: `tests/checkin-plan-experience.test.js`

- [ ] **Step 1: 写失败的页面集成测试**

在 `tests/checkin-plan-experience.test.js` 增加：

```js
test('plan page waits for real levels before presenting plan totals', () => {
  const script = fs.readFileSync(path.join(ROOT, 'pages/plan/plan.js'), 'utf8')
  const template = fs.readFileSync(path.join(ROOT, 'pages/plan/plan.wxml'), 'utf8')

  assert.match(script, /planLoading:\s*true/)
  assert.match(script, /computePlanStats\\(levelList,\s*this\\.data\\.groupsPerDay\\)/)
  assert.match(template, /wx:if="{{planLoading}}"/)
  assert.doesNotMatch(template, /每组 {{levelSize}} 词/)
})
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test tests/checkin-plan-experience.test.js`

Expected: FAIL，因为页面尚无 `planLoading`，且仍展示固定每组词数。

- [ ] **Step 3: 接入真实关卡列表**

在 `pages/plan/plan.js`：

```js
const {
  computePlanStats,
  getMaxGroups
} = require('../../utils/plan-stats')
```

删除文件内旧的 `computePlanStats(totalWords, groupsPerDay)`。在 `data` 中增加：

```js
planLoading: true,
dailyWords: 0,
totalLevels: 0,
estimatedDays: 0,
estimatedWeeks: 0,
```

`onLoad` 不再用总词数生成主路径统计，只先恢复保存的组数，并保持产品上限：

```js
const initialGroups = clamp(
  toPositiveInt(savedGroups, DEFAULT_GROUPS),
  MIN_GROUPS,
  MAX_GROUPS
)
```

`loadAllLevels` 在拿到 `levelList` 后一次更新真实统计和组数边界：

```js
const maxGroups = getMaxGroups(levelList, MAX_GROUPS)
const groupsPerDay = clamp(this.data.groupsPerDay, MIN_GROUPS, maxGroups)
this.setData(Object.assign({
  planLoading: false,
  levelList,
  groupsPerDay,
  maxGroups,
  presets: buildPresets(maxGroups)
}, computePlanStats(levelList, groupsPerDay), buildLevelViewState(levelList, false)))
```

`refreshPlan` 和 `setGroups` 都改为传入 `this.data.levelList`：

```js
refreshPlan(groupsPerDay) {
  this.setData(computePlanStats(this.data.levelList, groupsPerDay))
}
```

```js
this.setData(Object.assign(
  { groupsPerDay: next, numBump: nextBump },
  computePlanStats(this.data.levelList, next),
  { planMascot: buildPlanMascot(next) }
))
```

- [ ] **Step 4: 修改加载态与真实词数文案**

在 `pages/plan/plan.wxml` 中将固定描述：

```xml
<view class="book-tip">每个关卡固定 {{levelSize}} 词</view>
```

改为：

```xml
<view class="book-tip">每组对应 1 个教材关卡</view>
```

将每日提示改为：

```xml
<view wx:if="{{planLoading}}" class="daily-hint">正在加载真实关卡数据…</view>
<view wx:else class="daily-hint">
  今日约 <text class="hl">{{dailyWords}}</text> 词（{{groupsPerDay}} 个真实关卡，可选 {{minGroups}} - {{maxGroups}} 组）
</view>
```

结果区域在加载时显示占位：

```xml
<view class="result-num">{{planLoading ? '—' : totalLevels}}</view>
<view class="result-num">{{planLoading ? '—' : estimatedDays}}</view>
<view class="result-num">{{planLoading ? '—' : estimatedWeeks}}</view>
```

- [ ] **Step 5: 运行定向测试**

Run: `node --test tests/plan-stats.test.js tests/checkin-plan-experience.test.js tests/plan-preview.test.js`

Expected: 全部 PASS，0 FAIL。

- [ ] **Step 6: 提交页面接入**

```bash
git add pages/plan/plan.js pages/plan/plan.wxml tests/checkin-plan-experience.test.js
git commit -m "fix: calculate plans from real units"
```

### Task 3: 回归验证与需求核对

**Files:**
- Verify: `pages/plan/plan.js`
- Verify: `pages/plan/plan.wxml`
- Verify: `utils/plan-stats.js`
- Verify: `tests/plan-stats.test.js`

- [ ] **Step 1: 运行完整自动化测试**

Run: `npm test`

Expected: 所有测试 PASS，0 FAIL。

- [ ] **Step 2: 检查补丁格式**

Run: `git diff --check HEAD~2..HEAD`

Expected: 无输出，退出码 0。

- [ ] **Step 3: 核对关键需求**

Run:

```bash
rg -n "computePlanStats|planLoading|每日词数|每组对应|LEVEL_SIZE" pages/plan utils/plan-stats.js tests/plan-stats.test.js
```

Expected:

- 页面统计调用 `computePlanStats(levelList, groupsPerDay)`
- 页面存在真实关卡加载态
- 固定 `LEVEL_SIZE` 只用于接口失败后的兜底和旧存储兼容
- 1 组与 2 组的真实词数测试存在

- [ ] **Step 4: 查看最终改动范围**

Run: `git status --short && git log -3 --oneline`

Expected: 本功能文件已提交；用户原有的其他工作区改动保持不变。
