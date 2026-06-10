# 编译与部署指南

## 技术栈

| 技术 | 版本 |
|------|------|
| Next.js | 16.x |
| React | 19.x |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Node.js | 20+ |
| 国际化 | next-intl 4.x |
| 部署方式 | Nginx + Supervisor |

## 前置条件

### 开发机

- Node.js 20+
- npm

### 服务器

- Node.js 20+
- Nginx
- Supervisor

## 安装依赖

```bash
npm install
```

> 如遇到依赖冲突，可使用 `npm install --legacy-peer-deps`。

## 本地开发

```bash
npm run dev
```

启动后默认访问 http://localhost:3000，支持热更新。

## 编译打包

### 仅编译（不打包）

```bash
npm run build
```

构建产物输出到 `.next/` 目录。

### 编译并生成部署压缩包

```bash
npm run pack
```

执行后在项目根目录生成 **`chivoxmcp-<version>.tar.gz`**（版本号取自 `package.json` 中的 `version` 字段），可直接交付给运维部署。

压缩包内容：

```
chivoxmcp/
├── start.sh               # 启动脚本（自动加载 .env.local）
├── server.js              # Node.js 入口
├── node_modules/          # 仅包含运行时必要依赖
├── .next/static/          # 前端静态资源
├── public/                # 公共资源（图片、图标等）
├── .env.local             # 环境变量配置
└── README.txt             # 部署说明
```

### 本地预览生产构建

```bash
npm run build && npm run start
```

启动后访问 http://localhost:3000 可预览生产版本。

## 代码检查

```bash
npm run lint
```

## 环境变量

项目使用 `.env.local` 管理环境变量，主要配置项：

| 变量 | 说明 |
|------|------|
| `API_BASE_URL` | 后端 API 地址 |
| `SMTP_HOST` | 邮件 SMTP 服务器地址 |
| `SMTP_PORT` | SMTP 端口 |
| `SMTP_USER` | SMTP 用户名（发件账号） |
| `SMTP_PASS` | SMTP 密码 |
| `CONTACT_LEAD_TO` | 官网 / Global 联系表单咨询邮件的收件人；未设置时默认为 `ming.zhao@chivox.com` |

> **注意**：密码中的 `$` 符号需用 `\$` 转义，否则会被 dotenv-expand 当作变量引用。

---

## 运维部署指南

以下内容由运维人员在服务器上操作。

### 1. 解压部署包

将开发交付的 `chivoxmcp-x.x.x.tar.gz` 上传到服务器后：

```bash
# 解压到 /opt 目录（会生成 /opt/chivoxmcp/）
tar -xzf chivoxmcp-x.x.x.tar.gz -C /opt/

# 修改环境变量（按实际环境调整）
vi /opt/chivoxmcp/.env.local
```

### 2. 配置 Supervisor

安装 Supervisor（以 CentOS/RHEL 为例）：

```bash
yum install -y supervisor
systemctl enable supervisord
systemctl start supervisord
```

Ubuntu/Debian：

```bash
apt install -y supervisor
systemctl enable supervisor
systemctl start supervisor
```

创建配置文件 `/etc/supervisord.d/chivoxmcp.ini`（Ubuntu 下为 `/etc/supervisor/conf.d/chivoxmcp.conf`）：

```ini
[program:chivoxmcp]
command=/opt/chivoxmcp/start.sh
directory=/opt/chivoxmcp
user=www
autostart=true
autorestart=true
startsecs=5
startretries=3
stdout_logfile=/var/log/chivoxmcp/app.log
stderr_logfile=/var/log/chivoxmcp/error.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
stderr_logfile_maxbytes=50MB
stderr_logfile_backups=10
```

创建日志目录并启动：

```bash
mkdir -p /var/log/chivoxmcp
chown www:www /var/log/chivoxmcp

supervisorctl reread
supervisorctl update
supervisorctl start chivoxmcp
```

常用管理命令：

```bash
supervisorctl status chivoxmcp      # 查看状态
supervisorctl restart chivoxmcp     # 重启
supervisorctl stop chivoxmcp        # 停止
supervisorctl tail -f chivoxmcp     # 实时查看日志
```

### 3. 配置 Nginx

创建配置文件 `/etc/nginx/conf.d/chivoxmcp.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 静态资源缓存
    location /_next/static/ {
        alias /opt/chivoxmcp/.next/static/;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /opt/chivoxmcp/public/;
        expires 30d;
        access_log off;
    }
}
```

HTTPS 配置（可选）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

`GET /keys/:id/runway?additionalCents=0`

```ts
{
  windowDays: 28,
  avgDailyNetCents: number,
  balanceAfterCents: number,
  estimatedDays: number | null,
  estimatedCallsAtPace: number | null,
  confidence: 'high' | 'low' | 'none'
}
```

---

## 4. Usage（用量 & 图表）

### 前端调用方速查

| § | Endpoint | 前端文件 | UI 触发点 |
| --- | --- | --- | --- |
| 4.1 | `GET /usage/points` | `dashboard/usage/page.tsx`（主页）、`dashboard/billing/page.tsx`（Savings 折线图）、`dashboard/overview/page.tsx`（顶部 KPI 副标的小图） | Usage 页的日/月视图切换、日期范围选择器、project / key 过滤器 |
| 4.2 | `GET /usage/account-summary` | `dashboard/overview/page.tsx` | 顶部 4 个 KPI 卡（Calls / Spend / Savings / Spend cap used） |
| 4.3 | `GET /usage/export.csv` | `dashboard/usage/page.tsx` | 页面右上角 "Export CSV / 导出 CSV" 按钮 |

<p><img src="./images/dev-en/usage-page.png" alt="Usage 页截图（docs/images/dev-en/usage-page.png）" width="900" /></p>
<p><img src="./images/dev-en/overview-alerts.png" alt="Overview 首页 + 告警栈（docs/images/dev-en/overview-alerts.png）" width="900" /></p>

### 4.1 明细点（柱/面积图数据）

`GET /usage/points?from=2026-01-01&to=2026-04-23&projectId=&keyId=&granularity=day`

```ts
UsagePoint {
  date: 'YYYY-MM-DD',       // UTC
  keyId: string,
  model: 'mcp-call',        // 目前只有一种，预留多模型
  calls: number,
  costCents: number,        // 净额（已减 savings）
  savingsCents: number
}
```

建议支持窗口 `7 | 14 | 28 | 90` 天，最长 180 天。

### 4.2 账号月度汇总（Overview KPI）

`GET /usage/account-summary?month=2026-04`

```json
{
  "callsThisMonth": 108452,
  "spendCentsThisMonth": 9871,
  "savingsCentsThisMonth": 1320,
  "currentVolumeTier": { "upTo": 1000000, "discount": 0.15, "label": "100K – 1M calls" }
}
```

### 4.3 CSV 导出

`GET /usage/export.csv?from=&to=&keyId=&projectId=` → `text/csv`

- 列：`date,keyId,keyName,project,model,calls,costCents,savingsCents`

---

## 5. Billing（充值 / 额度 / 发票）

### 前端调用方速查

Billing 的接口既在 Billing 页自己用，也被 **充值弹窗 `stripe-checkout-modal.tsx`** 大量复用（弹窗被 Overview / Keys / Billing 三个地方唤起）。

| § | Endpoint | 前端文件 | UI 触发点 |
| --- | --- | --- | --- |
| 5.1 | `GET /billing/pricing` | `dashboard/billing/rates/page.tsx`、`stripe-checkout-modal.tsx` | Rates 页的阶梯价表格；充值弹窗的 "Next tier at N calls" 提示 |
| 5.2 | `GET /billing/spend-limit` | `dashboard/billing/page.tsx`、`dashboard/overview/page.tsx` | Billing "Monthly spend cap" 小卡；Overview "Spend limit used" KPI |
| 5.2 | `PUT /billing/spend-limit` | `dashboard/billing/page.tsx`（`SpendLimitEditor`） | 深链 `?edit=spend-limit#spend-limit` 自动进入编辑；"Save" 按钮提交 |
| 5.3 | `GET /billing/payment-methods` | `dashboard/billing/page.tsx`、`stripe-checkout-modal.tsx` | Billing "Payment methods" 区域；充值弹窗卡片选择器 |
| 5.3 | `POST /billing/payment-methods/setup-intent` + `/confirm` | `dashboard/billing/page.tsx`、`stripe-checkout-modal.tsx` | "Add payment method / 添加支付方式" 按钮；充值弹窗里 "Use a new card" 分支 |
| 5.3 | `POST /billing/payment-methods/:id/default` | `dashboard/billing/page.tsx` | 每张卡右侧 "Set as default" 按钮 |
| 5.3 | `DELETE /billing/payment-methods/:id` | `dashboard/billing/page.tsx` | 每张卡右侧 ⋯ → "Remove" |
| 5.4 | `POST /billing/topups/intent` | `_components/stripe-checkout-modal.tsx` | **所有 "Top up / Add credits / 充值" 按钮最终都落在这里**：Overview 告警条、Overview Paid key 列表、Starter 卡片、Paid key 卡片、Billing 页 Quick actions |
| 5.4 | `POST /billing/topups/:transactionId/confirm` | `_components/stripe-checkout-modal.tsx` | Stripe `confirmCardPayment` 成功后前端回调（也允许后端靠 webhook 自动完成） |
| 5.5 | `GET /billing/transactions` | `dashboard/recharge-history/page.tsx`、`dashboard/overview/page.tsx` | Recharge history 主列表；Overview "Recent activity" 右侧栏 |
| 5.6 | `GET /billing/invoices/:n.pdf` | `dashboard/recharge-history/page.tsx` | 每行右侧的 "Download PDF" 图标按钮 |

<p><img src="./images/dev-en/billing-page.png" alt="Billing 主页截图（docs/images/dev-en/billing-page.png）" width="900" /></p>
<p><img src="./images/dev-en/stripe-checkout-modal.png" alt="Top-up 充值弹窗截图（docs/images/dev-en/stripe-checkout-modal.png）" width="720" /></p>
<p><img src="./images/dev-en/recharge-history.png" alt="充值历史截图（docs/images/dev-en/recharge-history.png）" width="900" /></p>

### 5.1 定价

`GET /billing/pricing`

```json
{
  "mcpCallRatePerK": 1.0,
  "volumeTiers": [
    { "upTo": 100000, "discount": 0, "label": "0 – 100K calls" },
    { "upTo": 1000000, "discount": 0.15, "label": "100K – 1M calls" },
    { "upTo": 10000000, "discount": 0.30, "label": "1M – 10M calls" },
    { "upTo": null, "discount": null, "label": "10M+ calls" }
  ]
}
```

### 5.2 账户月度消费上限（Spend Limit）

- `GET /billing/spend-limit` →
  ```ts
  { monthlyCapCents: number; resetDay: number; warnAtPercents: number[] }
  ```
- `PUT /billing/spend-limit`
  ```json
  { "monthlyCapCents": 20000, "warnAtPercents": [50, 75, 90] }
  ```

### 5.3 支付方式（Stripe 托管）

```ts
PaymentMethod {
  id, brand: 'visa'|'mastercard'|'amex',
  last4: string, expMonth: number, expYear: number,
  name: string, isDefault: boolean, createdAt: string
}
```

- `GET /billing/payment-methods` → `PaymentMethod[]`
- `POST /billing/payment-methods/setup-intent` → `{ clientSecret, setupIntentId }`（用于前端 Stripe Element 绑卡）
- `POST /billing/payment-methods/confirm`
  ```json
  { "setupIntentId": "seti_...", "makeDefault": true }
  ```
  → `PaymentMethod`
- `POST /billing/payment-methods/:id/default`
- `DELETE /billing/payment-methods/:id` —— 若删除的是默认卡，后端自动把第一张剩余卡置为默认

### 5.4 充值到某个 Key（Credit Top-up）

前端 `stripe-checkout-modal.tsx` 支持：saved 卡 / new-card / Apple / Google / Link / Cash App / PayPal / Amazon Pay / ACH / Wire。
