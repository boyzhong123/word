# 开发者门户 vs 后端接口差异表

> 盘点日期：2026-06-01  
> 前端范围：`src/app/dev-en`、`src/app/register`、`src/app/auth/callback`  
> 后端依据：后端提供的 `api.md`  
> 按要求排除：`MCP Runtime`、内部接口、管理员接口

## 1. 结论先行

后端已经提供了一个可用的控制面骨架：密码登录、OTP 登录、基础个人资料、API Key 生命周期、用量路由、PayPal 充值、交易记录、发票、通知偏好和 Webhook 都有对应接口。

但当前开发者门户还不能完整切到真实后端。主要原因不是单纯“缺接口”，而是三类问题同时存在：

1. **业务模型未完全对齐**：当前页面已经采用“账户共享钱包 + PayPal 充值”的模型；后端已有 PayPal 充值和账户余额，但定价、钱包汇总字段还没有完全对齐。
2. **同名接口字段不足**：Keys、Usage、Limits、Transactions 都有路由，但不足以支撑当前页面上的筛选、图表、四维限额和钱包展示。
3. **页面有功能、后端未提供**：Projects、头像上传、账户低余额阈值仍缺接口。保存卡如果确认只走 PayPal，可以直接从页面移除，不一定要补后端。

### 状态说明

| 状态 | 含义 |
| --- | --- |
| ✅ 已满足 | 后端已有对应接口，主要字段可直接支撑当前页面 |
| ⚠️ 部分满足 | 路由存在，但字段、返回结构、单位或业务语义需要调整 |
| ❌ 缺失 | 当前页面需要，但后端文档没有对应接口 |
| ◻️ 可选 | 当前页面未真正展示，或可通过删减 UI 避免补接口 |

### 缺失归属说明

状态只表示完成度；“缺失归属”才说明下一步由谁处理：

| 缺失归属 | 含义 |
| --- | --- |
| 后端需补接口 / 字段 | 当前正式页面需要，后端文档尚未提供 |
| 前端需补页面 / 接入 | 后端已有能力，前端页面或真实接线尚未完成 |
| 双方需对齐 | 前后端契约、字段或业务口径不一致 |
| 产品先确认 / 待决策 | 先决定是否保留功能，再安排研发 |

## 2. 页面级总表

| 页面 / 功能 | 后端对应接口 | 状态 | 缺失归属 | 需要同事关注的点 |
| --- | --- | --- | --- | --- |
| 登录：邮箱 + 密码 | `POST /api/auth/login` | ✅ | 无需补充 | 可直接对接 |
| 登录：邮箱 OTP | `POST /api/auth/otp/send`、`POST /api/auth/otp/verify` | ⚠️ | 前端需补交互 | 首次 OTP 注册如要求同意条款，页面还没有传 `terms_accepted=true` |
| 登录：GitHub / Google OAuth | `GET /api/auth/oauth/:provider/start`、`.../callback` | ⚠️ | 双方需对齐 | 前后端回调契约不一致，见 §4.1 |
| 注册页 | `POST /api/auth/register`、`POST /api/auth/verify-email`、`POST /api/auth/resend-verification` | ⚠️ | 前端需补页面 | 后端要求邮箱验证，但当前前端注册后立刻调用登录 |
| Overview | `GET /api/billing/balance`、`GET /api/billing/summary`、`GET /api/usage/account-summary` | ⚠️ | 双方需补充 | 钱包累计字段不足，前端也尚未读取并展示真实数据 |
| API Keys | `/api/keys*` | ⚠️ | 后端需补字段 | 缺项目、环境、最后使用时间、完整限额字段 |
| API Keys：项目筛选 | 无 | ❌ | 后端需补接口 | 当前页面项目筛选只能依赖前端假数据 |
| Usage | `GET /api/usage/points`、`GET /api/usage/account-summary`、`GET /api/usage/export.csv` | ⚠️ | 后端需补字段 | 至少缺 `key_id`、`cost_cents`、`savings_cents` |
| Billing：钱包充值 | `POST /api/billing/topups/order`、`POST /api/billing/topups/:id/capture` | ⚠️ | 前端需接入 | 当前仍是本地模拟 |
| Billing：定价页 | `GET /api/billing/pricing` | ⚠️ | 产品先确认 | 后端文档和当前页面产品规则不一致 |
| Billing：交易与发票 | `GET /api/billing/transactions`、`GET /api/billing/invoices/:number` | ⚠️ | 双方需对齐 | 交易列表 envelope 与前端不一致 |
| Billing：保存卡 | 无 | ◻️ | 产品待决策 | PayPal-only 时建议删除保存卡 UI |
| Limits | `GET/PUT /api/billing/spend-limit`、`GET/PUT /api/billing/daily-limit` | ⚠️ | 后端需补接口 | 只覆盖部分维度，且单位有 mills / cents 差异 |
| Key Settings | `PATCH /api/keys/:id/settings` | ⚠️ | 后端需补字段 | 请求体文档仍为空对象 |
| Settings：通知 | `GET/PATCH /api/notifications/settings` | ✅ | 无需补充 | 字段基本完整 |
| Settings：低余额提醒 | 仅有通知总开关 | ❌ | 后端需补字段 | 还需要保存 `enabled` 和 `threshold_cents` |
| Profile | `GET/PATCH /api/auth/me` | ✅ | 无需补充 | 基础资料可用 |
| Profile：上传头像 | 无 | ❌ | 后端需补接口 | 页面直接调用 `POST /api/upload/avatar` |
| Webhooks | `/api/webhooks/endpoints*` | ◻️ | 前端可补页面 | 后端已提供，但当前控制台暂无管理页 |

## 3. 接口对应关系明细

### 3.1 Auth

| 前端需求 | 后端接口 | 状态 | 字段 / 行为核对 |
| --- | --- | --- | --- |
| 密码登录 | `POST /api/auth/login` | ✅ | `email`、`password`；返回 `token`、`user` |
| 密码注册 | `POST /api/auth/register` | ⚠️ | 接口存在；当前前端缺少“注册后输入邮箱验证码”的中间页 |
| 邮箱验证 | `POST /api/auth/verify-email` | ⚠️ | 后端已提供，但前端尚未调用 |
| 重发验证邮件 | `POST /api/auth/resend-verification` | ⚠️ | 后端已提供，但前端尚未调用 |
| OTP 发送 | `POST /api/auth/otp/send` | ✅ | 请求字段一致：`channel=email`、`identifier` |
| OTP 校验 | `POST /api/auth/otp/verify` | ⚠️ | 请求主体基本一致；首次注册需要明确 `terms_accepted` 的页面行为 |
| OAuth 发起 | `GET /api/auth/oauth/:provider/start` | ⚠️ | 后端要求 `state`；当前前端只传 `redirect` |
| OAuth 回调 | `GET /api/auth/oauth/:provider/callback` | ⚠️ | 后端回跳 `/oauth/callback#token=...`；前端页面实际监听 `/auth/callback?token=...` |
| 当前用户 | `GET /api/auth/me` | ✅ | 后端返回 `{ user }`；前端已有兼容解包 |
| 修改个人资料 | `PATCH /api/auth/me` | ✅ | `name`、`email`、`avatar_url` 足够 |
| 登出 | `POST /api/auth/logout` | ✅ | JWT 无状态，前端丢弃 token 即可 |

### 3.2 Projects

| 前端需求 | 后端接口 | 状态 | 字段 / 行为核对 |
| --- | --- | --- | --- |
| 项目列表 | 建议新增 `GET /api/projects` | ❌ | 至少返回 `id`、`name`、`slug`、`created_at` |
| 创建项目 | 建议新增 `POST /api/projects` | ❌ | 请求 `{ name }`；返回新项目 |
| Key 归属项目 | 扩展 `GET/POST /api/keys` | ❌ | Key 需要 `project_id`；创建 Key 时也要接收 `project_id` |

项目不是装饰字段。当前 Keys、Usage、Billing 三个页面都用项目做筛选和聚合；缺少项目接口后，这三处都会退化成默认项目。

### 3.3 API Keys

| 前端需求 | 后端接口 | 状态 | 字段 / 行为核对 |
| --- | --- | --- | --- |
| 列表 | `GET /api/keys` | ⚠️ | 已有基础字段；建议补 `project_id`、`env`、`last_used_at` 和限额字段 |
| 创建 | `POST /api/keys` | ⚠️ | 已支持 `{ name }`；建议支持 `project_id`、`env`，创建成功仅本次返回明文 secret |
| Starter 自动下发 | 建议由注册 / 首次登录流程保证 | ⚠️ | 当前页面依赖每个账号固定有一把 Starter Key；后端文档尚未明确自动下发时机 |
| Reveal | `GET /api/keys/:id/reveal` | ✅ | 已提供 |
| 重置 | `POST /api/keys/:id/reset` | ✅ | 已提供，可保留为后台兼容能力 |
| Toggle | `PUT /api/keys/:id/toggle` | ✅ | 已提供，可保留为后台兼容能力 |
| 重命名 | `PATCH /api/keys/:id` | ✅ | 已提供 |
| 轮转 secret | `POST /api/keys/:id/rotate` | ✅ | 已提供 |
| 暂停 / 恢复 | `POST /api/keys/:id/pause`、`.../resume` | ✅ | 已提供 |
| 撤销 | `POST /api/keys/:id/revoke` | ✅ | 已提供 |
| 彻底删除 | `DELETE /api/keys/:id` | ✅ | 已提供 |
| Key 用量摘要 | `GET /api/keys/:id/usage/summary` | ⚠️ | 路由存在；字段名需统一，见 §4.3 |
| Key 四维限额 | `PATCH /api/keys/:id/settings` | ⚠️ | 路由存在；文档需明确 body，至少支持四个 cap 字段 |

### 3.4 Usage

| 前端需求 | 后端接口 | 状态 | 字段 / 行为核对 |
| --- | --- | --- | --- |
| 日粒度明细 | `GET /api/usage/points` | ⚠️ | 需要按 Key 返回 `date/time`、`key_id`、`calls`、`cost_cents`、`savings_cents` |
| 项目筛选 | 扩展 `GET /api/usage/points?projectId=` | ❌ | 当前文档已有 `keyId`；建议新增 `projectId`。如改用 snake_case，应整组 query 一次性统一 |
| 账户月汇总 | `GET /api/usage/account-summary` | ⚠️ | 文档只写“账户级月度用量摘要”，未列字段；页面需要 calls、spend、savings |
| CSV 导出 | `GET /api/usage/export.csv` | ⚠️ | 路由存在；建议明确 CSV 列：`date,key_id,key_name,project_id,project_name,calls,cost_cents,savings_cents` |

### 3.5 Billing

| 前端需求 | 后端接口 | 状态 | 字段 / 行为核对 |
| --- | --- | --- | --- |
| 钱包当前余额 | `GET /api/billing/balance` | ⚠️ | 可展示余额；建议补累计充值、累计已用 |
| 钱包 / 试用汇总 | `GET /api/billing/summary` | ⚠️ | 已有较多可用字段；建议作为 Overview 和钱包条的统一数据源 |
| 定价 | `GET /api/billing/pricing` | ⚠️ | 路由存在，但规则与页面不一致，需先定产品口径 |
| PayPal 创建订单 | `POST /api/billing/topups/order` | ⚠️ | 与当前 PayPal 方向一致；建议返回 `credited_cents` |
| PayPal Capture | `POST /api/billing/topups/:id/capture` | ⚠️ | 应原子完成钱包入账、交易记录和回执邮件 |
| 交易列表 | `GET /api/billing/transactions` | ⚠️ | 后端返回 `{ items }`，当前前端 client 读取 `{ transactions }`；必须统一 |
| 交易详情 | `GET /api/billing/transactions/:id` | ✅ | 后端已提供，当前页面不是必须 |
| 发票下载 | `GET /api/billing/invoices/:number` | ✅ | 后端已提供 |
| 账户月度消费上限 | `GET/PUT /api/billing/spend-limit` | ⚠️ | 后端使用 mills，页面使用 cents；建议统一 API 单位 |
| 账户每日调用上限 | `GET/PUT /api/billing/daily-limit` | ⚠️ | 可映射页面的 `daily_call_cap` |
| 账户月度调用上限 | 建议扩展 limits 接口 | ❌ | 页面需要 `monthly_call_cap` |
| 账户每日消费上限 | 建议扩展 limits 接口 | ❌ | 页面需要 `daily_spend_cap_cents` |
| 保存卡管理 | 无 | ◻️ | PayPal-only 时建议删 UI；如保留 Stripe，再补卡管理接口 |

### 3.6 Settings、Profile

| 前端需求 | 后端接口 | 状态 | 字段 / 行为核对 |
| --- | --- | --- | --- |
| 通知设置 | `GET/PATCH /api/notifications/settings` | ✅ | 7 个字段与页面一致 |
| 账户低余额提醒 | 建议扩展 `GET/PATCH /api/notifications/settings` | ❌ | 建议新增 `low_balance_alert_enabled`、`low_balance_threshold_cents` |
| 修改资料 | `PATCH /api/auth/me` | ✅ | 已满足姓名和头像 URL 更新 |
| 上传头像 | 建议新增 `POST /api/upload/avatar` | ❌ | `multipart/form-data`，返回 `{ url }` |

## 4. 字段级审计

### 4.1 OAuth：当前无法直接联通

| 项目 | 当前前端 | 后端文档 | 结论 |
| --- | --- | --- | --- |
| 发起参数 | `redirect=/dashboard/overview` | 必填 `state` | 不一致 |
| 回跳页面 | `/auth/callback` | `/oauth/callback` | 不一致 |
| token 位置 | query：`?token=` | fragment：`#token=` | 不一致 |
| 新用户标记 | query：`is_new_user=true` | 未约定 | 不一致 |

建议统一为一次性 `code` 回跳，再由前端换 token；如果暂时不做换码，也至少统一 pathname、参数位置和 `state` 校验。

### 4.2 API Key 字段

| 页面需要字段 | 后端当前是否明确提供 | 结论 |
| --- | --- | --- |
| `id`、`name` | 是 | ✅ |
| 掩码 secret | `api_key` 返回掩码 | ✅ 建议改名为 `masked_api_key`，避免歧义 |
| 创建 / 轮转后一次性明文 secret | 是 | ✅ |
| `status`、`enabled`、`is_starter` | 是 | ✅ |
| `created_at` | 是 | ✅ |
| `project_id` | 否 | ❌ |
| `env`：development / production | 否 | ❌ |
| `last_used_at` | 否 | ❌ |
| `spend_cap_cents` | 设置接口未明确 | ⚠️ |
| `monthly_call_cap` | 否 | ❌ |
| `daily_spend_cap_cents` | 否 | ❌ |
| `daily_call_cap` | 否 | ❌ |

### 4.3 Usage 与交易字段

| 数据对象 | 页面至少需要 | 后端文档现状 | 结论 |
| --- | --- | --- | --- |
| `UsagePoint` | `date/time`、`key_id`、`calls`、`cost_cents`、`savings_cents` | 仅说明返回数据点数组 | ⚠️ 字段文档不足 |
| `AccountSummary` | 本月 calls、spend、savings，最好含按 Key 聚合 | 仅说明返回账户月度摘要 | ⚠️ 字段文档不足 |
| `TransactionList` | 统一 envelope；交易需 `id`、`amount_cents`、`status`、`method`、`description`、`invoice_number`、`created_at` | 后端 envelope 是 `{ items }`；前端 client 读取 `{ transactions }` | ⚠️ 必须统一 |
| `Transaction` 可选增强 | `credited_cents` | 未提供 | ⚠️ 建议补充，便于解释到账金额 |
| `WebhookEndpoint` | `enabled_events: string[]` | 后端示例像 JSON 字符串：`"[\"usage.threshold\", ...]"` | ⚠️ 建议直接返回数组 |

### 4.4 钱包、定价与试用包：先确认业务口径

| 项目 | 当前页面 | 后端文档 | 需要确认 |
| --- | --- | --- | --- |
| 钱包 | 所有 Key 共用账户钱包 | 有账户余额接口 | 方向一致 |
| 支付方式 | 当前充值弹窗默认只展示 PayPal | 后端提供 PayPal order / capture | 方向一致 |
| MCP 调用单价 | `$1 / 1,000 calls`，即 `$0.001 / call` | pricing 示例为 `0.7 / 0.6 / 0.5 cents per call` | 数值不一致 |
| 充值最低金额 | `$20` | `$10` | 不一致 |
| 充值预设 | `$20 / $50 / $100 / $300 / $500 / $1,000` | `$10 / $25 / $50 / $100` | 不一致 |
| 注册试用包 | `300 calls / 14 days` | `600 calls / 30 days` | 不一致 |
| 金额单位 | 页面内部 cents | 余额、限额接口使用 mills；交易使用 cents | 建议对外统一 cents，内部可保留 mills |

### 4.5 Limits：建议统一成一个接口

页面需要账户级和 Key 级两套四维上限：

| 维度 | 账户级 | Key 级 |
| --- | --- | --- |
| 每月消费金额 | `monthly_spend_cap_cents` | `monthly_spend_cap_cents` |
| 每月调用次数 | `monthly_call_cap` | `monthly_call_cap` |
| 每日消费金额 | `daily_spend_cap_cents` | `daily_spend_cap_cents` |
| 每日调用次数 | `daily_call_cap` | `daily_call_cap` |

建议将账户级能力合并到 `GET/PUT /api/billing/limits`，Key 级能力放在 `GET/PATCH /api/keys/:id/settings`。这样不需要前端组合 `spend-limit` 和 `daily-limit` 两组接口。

## 5. 当前前端仍在本地模拟的功能

这部分很重要：即使后端补齐接口，前端也还要接线。当前页面通过 mock store 保持演示可用，以下操作仍然只写浏览器本地数据：

| 功能 | 当前前端现状 | 后续动作 |
| --- | --- | --- |
| 账户钱包充值 | `topupAccount()` 本地加余额 | 接 `POST /api/billing/topups/order` 和 capture，成功后刷新余额、summary、transactions |
| 钱包真实数据接入 | 未请求 `/billing/balance` 或 `/billing/summary` | 登录后读取并展示钱包、试用包和 Overview 真实数据 |
| 账户低余额阈值 | 本地保存 | 扩展通知设置接口并接线 |
| 项目创建 | 本地保存 | 新增 Projects API 并接线 |
| 保存卡新增 / 删除 / 默认卡 | 本地保存 | PayPal-only 时删 UI；保留 Stripe 时补接口并接线 |
| Limits 页面保存 | 当前四维值只在本地更新 | 后端补四维 limits 后接线 |
| Key Settings | 仅月度金额上限可能被转发，其余三维本地 | 扩展 `PATCH /api/keys/:id/settings` |
| Usage 图表 | 后端数据会被降级为单一虚拟 Key，消费显示 0 | 扩展 usage 字段后移除降级映射 |
| Transactions 真实数据接入 | 前端读取 `transactions`，后端返回 `items` | 任一侧统一 envelope |
| Webhook | API client 已写，但页面尚未展示 | 后续新增管理页，或暂不处理 |

## 6. 建议实施顺序

### P0：先定口径，否则前后端会继续反复

1. 确认正式模型是“账户共享钱包”，不是“按 Key 充值”。
2. 确认海外支付先只上 PayPal，保存卡 UI 是否直接移除。
3. 确认调用单价、最低充值金额、预设金额、试用包数量和有效期。
4. 统一金额 API 单位：建议控制面一律返回整数 cents。

### P1：让 Overview、Billing、Keys、Usage 真正可用

1. 扩展 `/api/billing/summary` 或新增 `/api/billing/wallet`，补齐钱包累计充值和累计已用。
2. 对齐 PayPal order / capture 的入账语义，Capture 成功后原子写钱包和交易。
3. 明确 UsagePoint 与 AccountSummary 字段。
4. 统一交易列表 envelope：只保留 `{ items, total, page, page_size }` 或 `{ transactions, ... }` 中的一种。
5. 扩展 Key 字段和 Key Settings 四维限额。
6. 扩展账户级四维 limits。

### P2：补页面完整度

1. 新增 Projects API。
2. 新增头像上传接口。
3. 保存账户低余额提醒阈值。
4. 修正 OAuth 回调和邮箱注册验证流程。

## 7. 可以直接发给后端同事的一段话

当前前端主模型已经是“账户共享钱包”：所有 Key 共用一个余额，充值先按 PayPal 落到账户钱包，再由 MCP 调用消费；页面同时展示注册试用包、钱包余额、账户 / Key 四维限额。后端已有 Auth、Keys、Usage、PayPal 充值、Transactions、Invoice、Notifications 的骨架，但还需要补钱包汇总字段、usage 明细字段、四维 limits、Projects、头像上传和账户低余额阈值。OAuth 回调、注册邮箱验证、交易列表 envelope、金额单位、调用价格、充值档位和试用包参数也要统一。保存卡功能如果近期不做 Stripe，建议前端直接隐藏，不必补接口。

-- spec headings --
13:## 导读：先看这三张图
15:### 图 1 —— 系统拓扑
30:    USAGE["Usage<br/>/usage/*"]
61:### 图 2 —— 前端模块 ↔ 后端接口映射（按左侧导航顺序）
72:  OV["dashboard/overview"]:::page
74:  US["dashboard/usage"]:::page
98:  K9["GET /keys/:id/usage/summary"]:::api
101:  U1["GET /usage/points"]:::api
102:  U2["GET /usage/account-summary"]:::api
103:  U3["GET /usage/export.csv"]:::api
106:  B2["GET|PUT /billing/spend-limit"]:::api
130:### 图 3 —— 三条最关键的业务流程时序
185:  alt 余额 ≤ lowBalanceAlert.thresholdCents
186:    API-->>Dev: 发低余额邮件 (24h 去重)
187:  else 余额 = 0 或命中 spendCapCents
213:### 图 4 —— 关键数据结构之间的引用关系
228:    avatarUrl
287:## 0. 通用约定
305:## 0.1 计费模型变更清单（必须阅读）
308:> 目标：从“余额（美元）模型”切换到“次数（calls）模型”。
310:### A. 概念层变更（旧 → 新）
313:   - 旧：充值增加 `paidCreditsCents`（美元余额）。
314:   - 新：充值购买调用次数，最终体现在 key 的 `total_limit` 增长（前端展示为 calls remaining）。
317:   - 旧：看余额（`paidCreditsCents - paidCreditsUsedCents`）是否 > 0。
318:   - 新：看次数（`total_limit - total_used`）是否 > 0。
321:   - 旧：`monthly_limit_cents` / `spend_cap_cents` / `threshold_cents` 按美元理解。
332:### B. 接口层变更（重点）
349:### C. 兼容期 TODO（后端字段命名）
353:- `monthly_limit_cents` -> `monthly_limit_calls`
355:- `threshold_cents` -> `threshold_calls`
359:## 0.2 充值梯度与预设（前后端必须一致）
363:### 阶梯单价（整笔按档位单价，flat）
371:### 前端预设充值按钮（需明显展示）
380:### 计价示例
388:## 1. Auth（登录 / 会话）
393:### 前端调用方速查
401:| 1.5 | `PATCH /auth/me` | `dashboard/profile/page.tsx` | "Save changes / 保存修改"（name / email / avatar） |
406:### 1.1 发送一次性验证码
421:### 1.2 校验验证码并登录
434:### 1.3 OAuth 登录
442:### 1.4 当前用户
451:  avatarUrl?: string
457:### 1.5 修改资料
462:{ "name"?: "...", "email"?: "...", "avatarUrl"?: "..." }
467:### 1.6 登出
473:## 2. Projects（项目）
477:### 前端调用方速查
481:| 2.1 | `GET /projects` | `dashboard/keys/page.tsx`、`dashboard/usage/page.tsx`、`stripe-checkout-modal.tsx` | Keys 页项目分组、Usage 页项目过滤器、充值弹窗的项目选择器 |
484:### 2.1 列表
492:### 2.2 创建
502:## 3. API Keys（核心）
504:> 账号模型两层：**Starter Key**（每账号唯一，作为默认 key 自动创建）+ **账户级注册试用包**（默认 300 次，14 天内有效；到期或次数用完即失效）。后续调用统一走账户钱包，可设月度上限与低余额告警。
506:### 前端调用方速查
518:  OV["dashboard/overview/page.tsx"]:::page
519:  US["dashboard/usage/page.tsx"]:::page
540:  A_SUM["GET /keys/:id/usage/summary"]:::api
577:| 3.10 | `GET /keys/:id/usage/summary` | `dashboard/keys/page.tsx` 的 `PaidKeyCard`、`dashboard/overview/page.tsx`（最活跃付费 key 区块）、`dashboard/usage/page.tsx` | 每个 paid key 卡片的 "Lifetime calls" 数字 |
586:### 3.1 ApiKey 数据结构
614:  lowBalanceAlert: { enabled: boolean; thresholdCents: number } | null // 语义已切到“剩余次数阈值”
618:### 3.2 列表
624:### 3.3 创建 Paid Key
634:### 3.4 重命名
638:### 3.5 轮换 secret
644:### 3.6 暂停 / 恢复
650:### 3.7 撤销（软删除）
656:### 3.8 彻底删除（清理 revoked）
662:### 3.9 更新 Key 级设置（月度上限 / 低余额告警）
669:  "lowBalanceAlert": { "enabled": true, "thresholdCents": 500 } | null
675:### 3.10 Key 级用量汇总
677:`GET /keys/:id/usage/summary?window=28d`
691:### 3.11 Key 级 runway（可由前端用 3.10 自算，也可后端直接算）
708:## 4. Usage（用量 & 图表）
710:### 前端调用方速查
714:| 4.1 | `GET /usage/points` | `dashboard/usage/page.tsx`（主页）、`dashboard/billing/page.tsx`（Savings 折线图）、`dashboard/overview/page.tsx`（顶部 KPI 副标的小图） | Usage 页的日/月视图切换、日期范围选择器、project / key 过滤器 |
715:| 4.2 | `GET /usage/account-summary` | `dashboard/overview/page.tsx` | 顶部 4 个 KPI 卡（Calls / Spend / Savings / Spend cap used） |
716:| 4.3 | `GET /usage/export.csv` | `dashboard/usage/page.tsx` | 页面右上角 "Export CSV / 导出 CSV" 按钮 |
718:<p><img src="./images/dev-en/usage-page.png" alt="Usage 页截图（docs/images/dev-en/usage-page.png）" width="900" /></p>
719:<p><img src="./images/dev-en/overview-alerts.png" alt="Overview 首页 + 告警栈（docs/images/dev-en/overview-alerts.png）" width="900" /></p>
721:### 4.1 明细点（柱/面积图数据）
723:`GET /usage/points?from=2026-01-01&to=2026-04-23&projectId=&keyId=&granularity=day`
738:### 4.2 账号月度汇总（Overview KPI）
740:`GET /usage/account-summary?month=2026-04`
751:### 4.3 CSV 导出
753:`GET /usage/export.csv?from=&to=&keyId=&projectId=` → `text/csv`
759:## 5. Billing（充值 / 额度 / 发票）
761:### 前端调用方速查
768:| 5.2 | `GET /billing/spend-limit` | `dashboard/billing/page.tsx`、`dashboard/overview/page.tsx` | Billing "Monthly spend cap" 小卡；Overview "Spend limit used" KPI |
769:| 5.2 | `PUT /billing/spend-limit` | `dashboard/billing/page.tsx`（`SpendLimitEditor`） | 深链 `?edit=spend-limit#spend-limit` 自动进入编辑；"Save" 按钮提交 |
776:| 5.5 | `GET /billing/transactions` | `dashboard/recharge-history/page.tsx`、`dashboard/overview/page.tsx` | Recharge history 主列表；Overview "Recent activity" 右侧栏 |
783:### 5.1 定价（按次数）
801:### 5.2 账户月度调用上限（Calls Limit）
803:- `GET /billing/spend-limit` →
807:- `PUT /billing/spend-limit`
814:### 5.3 支付方式（Stripe 托管）
834:### 5.4 充值到某个 Key（Top-up by Calls）
854:  （更常见做法：后端监听 Stripe webhook，自动把本次购买次数写入 key 的 `total_limit`，并产出 `Transaction`。）
858:  2. `ApiKey.total_limit += purchased_calls`
861:### 5.5 交易 / 充值历史
880:### 5.6 发票下载
886:## 7. Notifications（通知偏好）
888:### 前端调用方速查
914:## 8. MCP 运行时接口（发放 key 的实际调用入口）
927:### 8.1 接入火山方舟 / 豆包（Responses API）
952:### 8.2 接入 Claude / OpenAI Responses API / Cursor
968:### 8.3 计费钩子
975:4. 低余额告警：剩余 ≤ `lowBalanceAlert.thresholdCents` 且 24h 内未发过 → 发邮件
978:鉴权失败 / 余额不足时，应按 MCP 规范返回 JSON-RPC error：`initialize` 阶段拒绝用 HTTP 401/402，`tools/call` 阶段用 JSON-RPC `error.code = -32000` + `data.reason` 承载业务码（`UNAUTHENTICATED` / `INSUFFICIENT_CREDITS` / `SPEND_CAP_EXCEEDED` / `TRIAL_EXHAUSTED` / `TRIAL_EXPIRED`）。
982:## 9. Webhooks（可选但强烈建议）
988:- `usage.spend_limit_warn / usage.spend_limit_hit`
1000:## 10. 派生字段 —— 前端可自算 vs 建议后端出
1009:| `estimateKeyCreditRunway` | ⚠️ 需要用量数据 | 建议后端出 `/keys/:id/runway` |
1010:| `getAccountCallsThisMonth / SpendThisMonth / Savings` | ⚠️ 需要用量 | 建议后端出 `/usage/account-summary` |
1014:### 10.1 Overview 页"需要关注"告警栏 — 触发规则
1016:Overview 顶部的 "Needs attention" 区域（`src/app/dev-en/dashboard/overview/page.tsx` → `buildAccountAlerts`）完全由已有接口数据推导，不需要后端单独出 "alerts" endpoint。对齐契约如下（按严重度排序；同页最多展示 3 条，超出折叠到 "+N more → Keys"）：
1020:| 1 | `spend-cap-hit` | critical | `account.spendCentsThisMonth ≥ SpendLimit.monthlyCapCents` | 提高上限 → `PUT /billing/spend-limit` | `SPEND_CAP_EXCEEDED` |
1022:| 3 | `trial-exhausted` | critical / warning | `trialTotalUsed ≥ trialTotalLimit` 或 `now ≥ trialExpiresAt`。**critical** 当且仅当账号钱包余额也为 0；否则降级为 warning（业务未中断，仅提示后续从钱包扣费） | 充值账户钱包 | `TRIAL_EXHAUSTED` / `TRIAL_EXPIRED` |
1023:| 4 | `wallet-low` | warning | 账户级 `lowBalanceAlert.enabled && 0 < walletBalance ≤ threshold` | Top up 钱包 | 无（只是前置提醒） |
1024:| 5 | `paid-low-balance` | warning | 存在 `ApiKey` 满足 `isLowBalance(k) === true`（即 `lowBalanceAlert.enabled && 0 < balance ≤ threshold`） | Top up 该 key | 无（只是前置提醒） |
1028:> 这同时意味着：**后端只需保证 §3 的 `ApiKey` 字段、§4.2 的 `account-summary`、§5.2 的 `spend-limit` 三组数据准确，前端就能自动把所有限额事件同步到 Overview。** 如果后端未来想在控制面单独提供 `GET /account/alerts` 聚合接口，按上表字段返回即可，前端可无缝切换到服务端权威数据。
1034:- **告警 #3**：试用包到期或次数用完后不再恢复；如果钱包有余额则只是 warning，如果钱包为 0 则升级为 critical。
1038:  - 新增一条 `Balance` 进度条，显示付费余额：`paidCreditsUsedCents / paidCreditsCents`，按 cents 格式化为 `$X.XX`，做首页的 "升级后的 Starter 其实在从 credit pool 扣费" 的视觉证据。
1047:<td><img src="./images/dev-en/overview-alerts.png" alt="升级前 Starter 条带（docs/images/dev-en/overview-alerts.png）" width="440" /></td>
1048:<td><img src="./images/dev-en/overview-starter-upgraded.png" alt="升级后 Starter 条带（docs/images/dev-en/overview-starter-upgraded.png）" width="440" /></td>
1064:## 11. 对接前需与后端确认的几点
1072:7. **审计日志**：revoked key / 修改 spend-limit 建议单独一张表，后面做 "Audit log" 页面直接可用。
1076:## 附录 A · 错误码建议
1086:| `INSUFFICIENT_CREDITS` | 402 | MCP 调用时余额不足 |
1093:## 附录 B · 字段枚举速查
