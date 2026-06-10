# 首页小怪兽逐帧动画 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 ImageGen 忠实参考现有三张小怪兽图片生成三套 4 帧精灵图，并在首页关卡卡片中轻柔循环播放。

**Architecture:** ImageGen 为每个状态生成一张 2×2 四帧参考图，本地处理脚本将四格规范化并合成为精确的横向精灵图。关卡数据提供精灵图地址与循环时长，首页通过现有 `frame-animation` 组件播放，并在缺少动画字段时回退到静态图。

**Tech Stack:** 微信小程序 WXML/WXSS/JavaScript、CSS sprite animation、Node.js 内置测试运行器、ImageGen、Pillow

---

### Task 1: 定义动画素材与页面契约

**Files:**
- Modify: `tests/home-units.test.js`
- Modify: `tests/home-page-integration.test.js`
- Create: `tests/mascot-assets.test.js`

- [ ] **Step 1: 写失败测试**

为完成、待学习、锁定状态断言 `mascotSprite`、`mascotDuration`，断言首页模板使用 `frame-animation` 并保留静态图回退，断言三张精灵图尺寸均为 `848 × 125`。

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/home-units.test.js tests/home-page-integration.test.js tests/mascot-assets.test.js`

Expected: FAIL，因为动画字段、模板接入和精灵图尚不存在。

### Task 2: 生成并规范化三套四帧素材

**Files:**
- Create: `scripts/build-mascot-sprite.py`
- Create: `images/home/mascot-progress-sprite.png`
- Create: `images/home/mascot-alert-sprite.png`
- Create: `images/home/mascot-sleep-sprite.png`

- [ ] **Step 1: 使用 ImageGen 生成三张 2×2 四帧参考图**

每张图对应一个状态，忠实保留原图角色、颜色、轮廓和表情，只改变规格中定义的轻微动作。

- [ ] **Step 2: 编写精灵图处理脚本**

脚本将 ImageGen 输出切为四格，清理近白背景，统一主体缩放和底部基线，然后横向合成为 `848 × 125` PNG。

- [ ] **Step 3: 生成最终精灵图**

Run:

```bash
python3 scripts/build-mascot-sprite.py <progress-source> images/home/mascot-progress-sprite.png
python3 scripts/build-mascot-sprite.py <alert-source> images/home/mascot-alert-sprite.png
python3 scripts/build-mascot-sprite.py <sleep-source> images/home/mascot-sleep-sprite.png
```

Expected: 三张图片尺寸均为 `848 × 125`。

- [ ] **Step 4: 运行素材测试确认通过**

Run: `node --test tests/mascot-assets.test.js`

Expected: PASS。

### Task 3: 接入关卡数据与逐帧组件

**Files:**
- Modify: `pages/home/home-units.js`
- Modify: `pages/home/home.js`
- Modify: `pages/home/home.wxml`
- Modify: `components/frame-animation/frame-animation.wxss`

- [ ] **Step 1: 为三种状态增加动画字段**

完成状态使用 `mascot-progress-sprite.png` 和 `2.4` 秒；待学习状态使用 `mascot-alert-sprite.png` 和 `2.4` 秒；锁定状态使用 `mascot-sleep-sprite.png` 和 `3.2` 秒。兜底关卡同样提供这些字段。

- [ ] **Step 2: 首页模板使用逐帧组件并保留回退**

当 `unit.mascotSprite` 存在时渲染：

```xml
<frame-animation
  url="{{unit.mascotSprite}}"
  count="4"
  width="169"
  height="99"
  duration="{{unit.mascotDuration}}"
  state="running"
/>
```

否则继续渲染原静态 `<image>`。

- [ ] **Step 3: 修正逐帧组件背景位移动画**

让背景从第一帧向左移动至第四帧，使用 `steps(var(--count))` 无限循环，并禁止背景重复。

- [ ] **Step 4: 运行行为测试确认通过**

Run: `node --test tests/home-units.test.js tests/home-page-integration.test.js`

Expected: PASS。

### Task 4: 完整验证

**Files:**
- Verify: `images/home/mascot-*-sprite.png`
- Verify: `pages/home/home-units.js`
- Verify: `pages/home/home.js`
- Verify: `pages/home/home.wxml`
- Verify: `components/frame-animation/frame-animation.wxss`

- [ ] **Step 1: 运行全部自动化测试**

Run: `node --test tests/*.test.js`

Expected: 全部 PASS。

- [ ] **Step 2: 运行 JavaScript 与 Python 语法检查**

Run:

```bash
node --check pages/home/home-units.js
node --check pages/home/home.js
node --check tests/home-units.test.js
node --check tests/home-page-integration.test.js
node --check tests/mascot-assets.test.js
python3 -m py_compile scripts/build-mascot-sprite.py
```

Expected: 所有命令退出码为 0。

- [ ] **Step 3: 检查图片尺寸与视觉内容**

确认三张精灵图均为 `848 × 125`，四帧角色一致、动作轻微、无明显跳动，并且状态特效完整。

- [ ] **Step 4: 核对需求覆盖**

确认使用 ImageGen、每状态 4 帧、忠实原图、轻柔常驻循环、旧图回退以及首页原有点击行为不变。