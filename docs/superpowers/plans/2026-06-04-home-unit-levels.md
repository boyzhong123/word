# 首页全量关卡 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将接口返回的全部期数据按一期一个关卡展示在首页，并通过每次 20 条的增量渲染保持列表流畅。

**Architecture:** 新增纯函数模块负责接口字段规范化、排序、状态映射和批次计数，首页页面负责请求完整列表并只把当前可见批次写入 `data.units`。现有练习页接口保持不变，仅“跟读背诵”使用对应 `unitId` 跳转。

**Tech Stack:** 微信小程序 JavaScript/WXML、CommonJS、Node.js 内置测试运行器

---

### Task 1: 关卡数据适配与批次计算

**Files:**
- Create: `pages/home/home-units.js`
- Create: `tests/home-units.test.js`

- [x] **Step 1: 写失败测试**

覆盖接口列表全量映射、按 `sort` 排序、完成/未完成/锁定状态、空列表兜底以及每次追加 20 条。

- [x] **Step 2: 运行测试确认失败**

Run: `node --test tests/home-units.test.js`

Expected: FAIL，因为 `pages/home/home-units.js` 尚不存在。

- [x] **Step 3: 实现纯数据适配模块**

导出：

```js
module.exports = {
  DISPLAY_BATCH_SIZE,
  buildDisplayUnits,
  getNextVisibleCount
}
```

`buildDisplayUnits(apiUnits, fallbackUnits)` 在接口有数据时映射全部条目并排序，在接口为空时克隆兜底数据。`getNextVisibleCount(total, current)` 返回不超过总数的下一批可见数量。

- [x] **Step 4: 运行测试确认通过**

Run: `node --test tests/home-units.test.js`

Expected: PASS，所有数据适配测试通过。

### Task 2: 首页接入全量关卡和增量渲染

**Files:**
- Modify: `pages/home/home.js`
- Modify: `pages/home/home.wxml`

- [x] **Step 1: 首页使用数据适配模块**

移除页面内旧的 `buildDisplayUnits()`，保留现有三条 `FALLBACK_UNITS`，通过新模块构建关卡列表。

- [x] **Step 2: 增加可见列表状态**

页面实例保存完整列表和当前可见数量；初始化、接口加载和切换教材时重置列表，首次最多展示 20 条。

- [x] **Step 3: 增加滚动到底追加**

在首页 `scroll-view` 绑定 `bindscrolltolower="loadMoreUnits"`，每次将下一批最多 20 个关卡写入 `data.units`。

- [x] **Step 4: 阻止锁定关卡进入练习**

点击锁定关卡的“跟读背诵”时显示“开通会员后解锁”，不导航；其他非跟读任务继续显示“内容待补充”。

### Task 3: 完整验证

**Files:**
- Verify: `pages/home/home-units.js`
- Verify: `pages/home/home.js`
- Verify: `pages/home/home.wxml`

- [x] **Step 1: 运行自动化测试**

Run: `node --test tests/home-units.test.js`

Expected: PASS。

- [x] **Step 2: 运行 JavaScript 语法检查**

Run: `node --check pages/home/home-units.js && node --check pages/home/home.js && node --check tests/home-units.test.js`

Expected: 所有命令退出码为 0。

- [x] **Step 3: 静态核对页面绑定**

确认首页滚动容器绑定 `loadMoreUnits`，任务点击仍携带 `unitIndex` 与 `taskType`，并且接口加载使用完整 `data.list`。

- [x] **Step 4: 核对需求覆盖**

逐项核对设计文档中的一期一关卡、全量排序、20 条增量渲染、三任务入口、`needVip` 锁定、完成状态进度及空数据兜底。