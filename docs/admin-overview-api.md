# 超管平台概览接口文档

本文档对应前端页面：`src/app/[locale]/dashboard/overview/page.tsx` 中的超管 `AdminOverview`。

## 目标

超管平台概览不使用样例数据。当前页面优先复用个人用户管理、企业用户管理已上线接口做实时聚合；趋势、排行、健康状态、近期事件需要后端补充平台级聚合接口。

## 鉴权

所有接口均要求管理员登录态：

```http
Authorization: Bearer <admin_jwt>
```

非管理员应返回：

```http
403 Forbidden
```

## 当前已接入接口

### 1. 个人用户列表

```http
GET /admin/users?page=1&page_size=500
```

用于计算：

- 个人用户数
- 个人 API Key 总数
- 个人累计调用量
- 活跃个人用户数
- 最近注册个人用户

响应：

```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "tester",
      "role": "user",
      "created_at": "2026-05-13T10:00:00Z",
      "key_count": 3,
      "total_used": 1280
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 500
}
```

### 2. 企业用户列表

```http
GET /admin/b2b/tenants?page=1&page_size=500
```

用于计算：

- 企业用户数
- 正常企业用户数
- 最近创建企业用户

响应：

```json
{
  "tenants": [
    {
      "id": 12,
      "company_name": "Acme Education",
      "contact_email": "ops@example.com",
      "username": "acme",
      "status": "active",
      "created_at": "2026-05-13T10:00:00Z",
      "updated_at": "2026-05-13T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 500
}
```

### 3. 企业配额

```http
GET /admin/b2b/tenants/{tenant_id}/quota
```

用于计算：

- 企业总配额
- 企业已用配额
- 企业剩余配额
- 有配额数据企业数

响应：

```json
{
  "tenant_id": 12,
  "total_limit": 100000,
  "total_used": 12345,
  "total_remaining": 87655
}
```

### 4. 企业凭证列表

```http
GET /admin/b2b/tenants/{tenant_id}/credentials
```

用于计算：

- 企业凭证总数
- 启用中的企业凭证数

响应：

```json
{
  "credentials": [
    {
      "id": 99,
      "tenant_id": 12,
      "access_key": "cvx_ak_xxx",
      "status": "active",
      "created_at": "2026-05-13T10:00:00Z"
    }
  ]
}
```

## 建议新增聚合接口

以下接口用于替代前端逐个租户拉取和补齐趋势、排行、健康状态。上线后前端可直接切换到聚合接口。

### 1. 平台概览汇总

```http
GET /admin/overview/summary
```

响应：

```json
{
  "personal_users": 120,
  "tenant_users": 18,
  "personal_api_keys": 305,
