# API 文档

## 接口概览

- 基础URL: `/api`
- 认证方式: Bearer Token
- 响应格式: JSON

## 认证相关

### POST /auth/register
用户注册

**请求体:**
```json
{
  "username": "string (4-20位字母数字下划线)",
  "password": "string (6-20位，必须包含字母和数字)",
  "phone": "string (11位手机号)"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": { "id", "username", "phone", "role", "createdAt" },
    "token": "string",
    "refreshToken": "string"
  }
}
```

### POST /auth/login
用户登录

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": { "id", "username", "phone", "role" },
    "token": "string",
    "refreshToken": "string"
  }
}
```

### GET /auth/me
获取当前用户信息

**请求头:**
```
Authorization: Bearer <token>
```

## 商品管理

### GET /products
获取商品列表

**查询参数:**
- `page`: 页码 (默认: 1)
- `pageSize`: 每页数量 (默认: 20, 最大: 100)
- `name`: 商品名称（模糊搜索）
- `status`: 状态过滤 (NORMAL/WARNING/EXPIRED，可多选用逗号分隔)
- `startDate`: 生产日期开始 (ISO 8601)
- `endDate`: 生产日期结束

**响应:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### POST /products
创建商品

**请求体:**
```json
{
  "name": "string (必填, 最大100字符)",
  "productionDate": "2024-01-01",
  "shelfLife": 180,
  "reminderDays": 3
}
```

### PUT /products/:id
更新商品

### DELETE /products/:id
删除商品

### POST /products/batch/delete
批量删除

**请求体:**
```json
{
  "ids": [1, 2, 3]
}
```

### POST /products/batch/import
批量导入（Excel）

**请求:**
```
Content-Type: multipart/form-data
file: <Excel文件>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "success": 50,
    "failed": 2,
    "errors": [{ "row": 10, "error": "..." }]
  }
}
```

### GET /products/template/export
下载导入模板

### GET /products/stats
获取统计数据

**响应:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "normal": 80,
    "warning": 15,
    "expired": 5,
    "todayAdded": 10,
    "statusDistribution": [...],
    "monthlyTrend": [...],
    "upcomingExpiry": [...]
  }
}
```

## 错误码

| 错误码 | 描述 |
|--------|------|
| AUTH_TOKEN_MISSING | 未提供认证令牌 |
| AUTH_TOKEN_EXPIRED | 令牌已过期 |
| AUTH_TOKEN_INVALID | 无效的令牌 |
| AUTH_USER_NOT_FOUND | 用户不存在 |
| AUTH_ACCOUNT_DISABLED | 账号已禁用 |
| AUTH_REQUIRED | 未认证 |
| FORBIDDEN | 权限不足 |
| VALIDATION_ERROR | 参数验证失败 |
| DUPLICATE_ENTRY | 数据已存在 |
| RECORD_NOT_FOUND | 记录不存在 |
| DATABASE_ERROR | 数据库操作失败 |
| FILE_TOO_LARGE | 文件大小超过限制 |
| UPLOAD_ERROR | 文件上传失败 |
| NOT_FOUND | 资源不存在 |
| INTERNAL_ERROR | 服务器内部错误 |

## 状态码

| HTTP 状态 | 含义 |
|-----------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 数据冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |
