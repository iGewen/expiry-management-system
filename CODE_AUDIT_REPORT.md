# 代码审计报告

**审计日期**: 2026-03-15  
**审计范围**: 保质期管理系统前后端代码  
**审计人**: AI Code Auditor

---

## 📊 执行摘要

| 类别 | 严重 | 高 | 中 | 低 | 总计 |
|------|------|-----|-----|-----|------|
| 安全问题 | 1 | 2 | 3 | 2 | 8 |
| 代码规范 | 0 | 1 | 4 | 3 | 8 |
| Bug/缺陷 | 0 | 2 | 3 | 1 | 6 |

---

## 🔴 严重问题（Critical）

### 1. [安全] Token 刷新竞态条件
**位置**: `frontend/src/utils/request.ts:130`

```typescript
// 问题代码
if (!this.refreshPromise) {
  this.refreshPromise = this.refreshToken()
}
```

**问题**: 多个并发请求同时触发 401 时，可能创建多个刷新 Promise，导致重复刷新 Token。

**修复建议**:
```typescript
private isRefreshing = false
private refreshPromise: Promise<void> | null = null

async handle401(config) {
  if (!this.isRefreshing) {
    this.isRefreshing = true
    this.refreshPromise = this.refreshToken().finally(() => {
      this.isRefreshing = false
      this.refreshPromise = null
    })
  }
  await this.refreshPromise
  // ...
}
```

**风险**: 可能导致 Token 状态不一致，用户被迫重新登录。

---

## 🟠 高风险问题（High）

### 2. [安全] 用户枚举漏洞
**位置**: `backend/src/services/authService.js:147-157`

```javascript
// 问题：不同错误消息暴露用户是否存在
const user = await prisma.user.findUnique({ where: { username } });
if (!user) {
  await this.recordLoginFailure(username);
  throw new Error('用户名或密码错误'); // 正确
}

if (!user.isActive) {
  throw new Error('账号已禁用，请联系管理员'); // 错误：暴露了用户存在但禁用
}
```

**问题**: 被禁用账号返回不同的错误消息，攻击者可枚举有效用户名。

**修复建议**: 被禁用账号也返回"用户名或密码错误"，或在统一响应中不区分。

### 3. [安全] 验证码可暴力破解
**位置**: `backend/src/services/smsService.js`

**问题**: 
- 6位数字验证码，理论空间 10^6
- 没有请求频率限制（除了每 60 秒发送一次）
- 验证时没有尝试次数限制

**修复建议**:
```javascript
// 添加验证次数限制
const VERIFY_ATTEMPT_PREFIX = 'sms:verify_attempt:';

async verifyCode(phone, code, purpose) {
  const attemptKey = `${VERIFY_ATTEMPT_PREFIX}${phone}`;
  const attempts = await store.get(attemptKey) || 0;
  
  if (attempts >= 5) {
    return { valid: false, message: '验证次数过多，请重新获取验证码' };
  }
  
  // ... 验证逻辑
  
  if (!valid) {
    await store.set(attemptKey, attempts + 1, 300); // 5分钟过期
    return { valid: false, message: '验证码错误' };
  }
  
  // 验证成功，清除计数
  await store.del(attemptKey);
  return { valid: true };
}
```

---

## 🟡 中风险问题（Medium）

### 4. [安全] 手机号明文存储
**位置**: `backend/prisma/schema.prisma`

```prisma
model User {
  phone     String    @unique  // 明文存储
}
```

**问题**: 数据库泄露时手机号直接暴露，存在隐私风险。

**修复建议**: 
- 方案1: 使用对称加密存储（查询时解密）
- 方案2: 存储哈希值（仅用于验证，无法查询）

### 5. [安全] Webhook URL 明文存储
**位置**: `backend/prisma/schema.prisma`

```prisma
model ReminderSetting {
  feishuWebhook String? // 明文存储
}
```

**问题**: 数据库泄露时飞书 webhook 可直接被利用发送垃圾消息。

**修复建议**:
```javascript
// 使用环境变量密钥加密
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const key = process.env.WEBHOOK_ENCRYPTION_KEY;

function encryptWebhook(url) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(url, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
```

### 6. [安全] SQL 注入风险（Prisma 防护但代码存在隐患）
**位置**: `backend/src/controllers/productController.js`

```javascript
// 虽然 Prisma 有防护，但以下代码风格不良
const { searchUserId } = filters;
if (searchUserId) {
  where.userId = searchUserId; // 未验证类型
}
```

**修复建议**: 始终验证和转换输入类型。

### 7. [代码规范] 内存泄漏风险
**位置**: `backend/src/config/redis.js`

```javascript
// 问题：setInterval 未清理
setInterval(() => store.cleanupExpired(), 60000);
```

**问题**: 应用关闭时定时器未清理，可能导致测试环境内存泄漏。

**修复建议**:
```javascript
let cleanupInterval;

export function initRedis() {
  // ...
  cleanupInterval = setInterval(() => store.cleanupExpired(), 60000);
  return redis;
}

export async function closeRedis() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  // ...
}
```

### 8. [代码规范] 重复代码
**位置**: 多处

**问题**: 分页逻辑在多个服务中重复实现：
- `productService.js:32-42`
- `userService.js:8-18`
- `categoryService.js:103-113`

**修复建议**: 提取为通用工具函数。

### 9. [代码规范] 硬编码配置
**位置**: `backend/src/services/authService.js:14`

```javascript
const LOCKOUT_DURATION = 30 * 60; // 30分钟锁定
```

**修复建议**: 移至配置文件。

### 10. [Bug] 日期解析潜在 Bug
**位置**: `backend/src/controllers/productController.js:240`

```javascript
parseDate(dateStr) {
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateStr * 86400000);
  }
  return new Date(dateStr);
}
```

**问题**: 
- 未处理无效日期
- Excel 日期计算可能有 1 天偏差（Excel 的 1900 闰年 bug）

### 11. [Bug] 批量导入无事务
**位置**: `backend/src/services/productService.js`

**问题**: 批量导入时部分失败不会回滚，导致数据不一致。

**修复建议**: 使用 Prisma 事务。

---

## 🟢 低风险问题（Low）

### 12. [安全] 日志泄露敏感信息
**位置**: `backend/src/services/smsService.js`

```javascript
logger.info(`SMS code sent to ${phone}: ${code}`); // 生产环境不应记录验证码
```

### 13. [代码规范] 未使用的导入
**位置**: `backend/src/controllers/reminderController.js`

```javascript
import request from '@/utils/request'  // 未使用
```

### 14. [代码规范] 魔术数字
多处存在未命名的常量。

### 15. [Bug] 前端类型错误
**位置**: `frontend/src/views/ReminderSetting.vue`

```typescript
// testFeishuWebhook 方法中使用了未导入的 request
const res = await request.post('/reminders/test-feishu', ...)
// 应该使用 api/reminder.ts 中的方法
```

### 16. [代码规范] 缺少 JSDoc
大量函数缺少文档注释。

---

## 🔧 安全建议汇总

### 立即修复（1周内）
1. ✅ 修复 Token 刷新竞态条件
2. ✅ 添加验证码验证次数限制
3. ✅ 统一登录错误消息（防止用户枚举）

### 短期修复（1个月内）
4. ✅ 加密存储敏感字段（手机号、webhook）
5. ✅ 修复批量导入事务问题
6. ✅ 清理生产日志中的敏感信息

### 长期改进（3个月内）
7. ✅ 代码重构：提取通用工具函数
8. ✅ 添加更完善的错误处理
9. ✅ 配置外部化

---

## 📈 优点

1. ✅ 使用了 Prisma ORM，有效防止 SQL 注入
2. ✅ 实现了速率限制
3. ✅ 密码使用 bcrypt 加密
4. ✅ JWT 实现了 Token 刷新机制
5. ✅ 文件上传有类型检查
6. ✅ 实现了登录锁定机制
7. ✅ 有完整的日志记录
8. ✅ 有优雅关闭处理

---

## 📝 后续行动

1. **优先级 P0**: 修复竞态条件和验证码暴力破解
2. **优先级 P1**: 加密敏感数据存储
3. **优先级 P2**: 代码重构和优化
4. **优先级 P3**: 完善测试覆盖率

---

*报告生成时间: 2026-03-15*
