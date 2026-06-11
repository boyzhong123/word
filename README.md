# Word · 英语学习微信小程序

> 版本 `0.1.2` · 一款面向中小学生的英语词汇学习小程序，融合关卡地图、背单词、随身听、背诵跟读、打卡与学习计划。

## 功能概览

| 模块 | 页面 | 说明 |
|------|------|------|
| 学习首页 | `pages/home` | 关卡地图 + 今日任务（背单词 / 背诵 / 听力），支持词书切换、进度追踪、吉祥物动效 |
| 背单词 | `pages/practice` | 卡片式识记，含音标、释义、近义词、联想记忆、词根、背诵技巧等详情 Tab |
| 随身听 | `pages/listen` | 黑胶唱机风格播放器，支持课文听力、跟读测评、听力小测 |
| 背诵跟读 | `pages/listen` | 分段背诵与语音评测（集成驰声 Chivox SDK） |
| 学习计划 | `pages/plan` | 按词书总词数设置每日练习组数，自动拆分关卡 |
| 打卡日历 | `pages/checkin` | 连续打卡、今日完成、累计打卡统计 |
| 学习报告 | `pages/report` | 关卡学情报告，薄荷绿胶冻视觉风格 |
| 我的 | `pages/me` | 登录、学习统计、设置入口 |
| 迷你播放条 | `custom-tab-bar` | 跨页持续播放，封面取色背景 |

## 技术栈

- **框架**：微信小程序原生（WXML / WXSS / JavaScript）
- **基础库**：`2.19.4`（见 `project.config.json`）
- **语音评测**：`lib/ChivoxAiEngine.js`
- **测试**：Node.js 内置 `node --test`
- **资源构建**：Python 脚本（`scripts/` 目录，雪碧图、唱臂素材等）

## 目录结构

```
├── app.js / app.json / app.wxss   # 小程序入口
├── pages/                         # 页面
│   ├── home/                      # 学习首页 & 关卡地图
│   ├── practice/                  # 背单词
│   ├── listen/                    # 随身听 & 跟读
│   ├── plan/                      # 学习计划
│   ├── checkin/                   # 打卡日历
│   ├── report/                    # 学习报告
│   └── me/                        # 我的
├── components/                    # 公共组件（导航、弹窗、帧动画、媒体等）
├── custom-tab-bar/                # 自定义底部栏 + 迷你播放器
├── utils/                         # API、登录、播放器、工具函数
├── images/                        # 图片资源
├── scripts/                       # 素材构建脚本
└── tests/                         # 单元测试
```

## 本地开发

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- Node.js 18+（运行测试）
- Python 3（可选，用于重新生成图片资源）

### 启动步骤

1. 用微信开发者工具打开本项目根目录
2. 确认 `project.config.json` 中的 AppID（当前：`wx380d793f1aa5606b`）
3. 编译预览即可在模拟器或真机调试

后端接口默认指向 `https://pb10.91tszx.com`，在 `app.js` 中配置。

### 运行测试

```bash
# 全部测试
node --test tests/*.test.js

# 单个模块
node --test tests/home-units.test.js
node --test tests/listen-quiz.test.js
node --test tests/practice-word-detail.test.js
```

### 重新生成素材（可选）

```bash
python3 scripts/build-home-missing-assets.py
python3 scripts/build-listen-turntable-assets.py
python3 scripts/build-pk-sprite.py
```

## 主要页面路由

| 路径 | 用途 |
|------|------|
| `/pages/home/home` | Tab · 学习 |
| `/pages/me/me` | Tab · 我的 |
| `/pages/practice/practice` | 背单词 |
| `/pages/listen/listen` | 随身听 / 跟读 |
| `/pages/plan/plan` | 学习计划 |
| `/pages/checkin/calendar` | 打卡日历 |
| `/pages/report/report` | 关卡报告 |

## 版本记录

### v0.1.1

- 打卡页 Jelly 胶冻图标资源与构建脚本
- 背单词、学习报告、媒体组件样式优化
- 补充项目 README

### v0.1.0

- 首页关卡地图、吉祥物帧动画、今日任务流
- 随身听黑胶播放器、跟读测评、听力小测
- 背单词详情页（近义词 / 联想 / 词根 / 背诵技巧）
- 打卡日历、学习计划、学习报告、我的页面改版
- 自定义 TabBar 迷你播放条
- Jelly 胶冻风格 UI 资源与构建脚本

## 许可证

私有项目，未经授权请勿分发。
