# 小程序页面截图（技术文档用）

自动生成：`npm run doc:screenshots`（依赖本机已安装微信开发者工具，脚本见 `scripts/capture-mini-app-screenshots.mjs`）。

也可手动将截图放到本目录，文件名与 `docs/mini-app-tech-doc.html` 中引用一致即可自动显示。

微信发给同事时，请运行 `npm run doc:share` 生成内嵌截图的单文件 `docs/mini-app-tech-doc.share.html`，只发这个 HTML 即可，无需附带图片文件夹。

## 推荐截图清单

| 文件名 | 对应页面 | 建议截取内容 |
| --- | --- | --- |
| `01-home-level-list.png` | 首页 · 闯关列表 | 词书卡片 + 关卡分类列表（含今日标记） |
| `01-home-map.png` | 首页 · 地图视图 | 地图闯关 trail + 小怪兽节点 |
| `01-home-book-picker.png` | 首页 · 切换教材 | 学段/版本/词书选择弹窗 |
| `02-checkin-calendar.png` | 打卡日历 | 月历 + 连续打卡天数 + 奖励进度 |
| `02-checkin-poster.png` | 打卡分享海报 | 生成海报预览页 |
| `03-listen-player.png` | 随身听 · 播放 | 黑胶封面 + 播放控制条 |
| `03-listen-follow.png` | 随身听 · 跟读 | 课文列表 + 展开跟读评测 |
| `03-listen-quiz.png` | 关卡小测 | 听音填空 / 背诵评测 |
| `04-me-profile.png` | 我的 | 头像、统计、菜单入口 |
| `04-me-book.png` | 我的教材 | 已购/可用词书列表 |
| `05-practice-word.png` | 单词新学 | 单词卡片 + 详情 Tab |
| `05-practice-recite.png` | 跟读背诵 | 例句跟读 + 评分反馈 |
| `06-finish-today.png` | 关卡完成 | 今日进度 + 继续学习 |
| `06-advertisement.png` | 商品详情 | 套餐选择与购买入口 |
| `06-vip.png` | 确认订单 | vip 页订单明细与支付按钮 |
| `06-plan.png` | 学习计划 | 每日组数 + 预计完成天数 |

| `06-finish-word.png` | 单词新学完成 | finish/today 环节 1/3 |

当前截图由开发者工具 CLI 自动截取（2026-06-16）。重新生成：`npm run doc:screenshots` 或 `node scripts/capture-mini-app-screenshots.mjs --only=practice,recite,quiz`。
