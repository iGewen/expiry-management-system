# 优化变更日志

## 版本 1.1.0 - 2026-03-14

### 🚨 高优先级优化

#### 1. 数据库性能优化
- **添加冗余字段**: `Product` 表新增 `expiryDate` 和 `status` 字段
- **复合索引优化**: 添加 `(userId, status, isDeleted)` 复合索引
- **查询优化**: 使用数据库查询替代内存过滤，避免 N+1 问题
- **统计优化**: 使用 `groupBy` 替代全表扫描

#### 2. JWT 安全加固
- 生产环境强制要求设置 `JWT_SECRET`（至少 32 字符）
- 添加 Refresh Token 机制
- Token 过期自动刷新功能

#### 3. 文件上传安全
- 添加文件魔数检测
- 使用 UUID 生成文件名
- 定期清理临时文件

#### 4. 批量导入事务保护
- 使用 Prisma 事务保证数据一致性
- 添加单次导入数量限制（1000 条）

### ⚠️ 中优先级优化

#### 5. 数据库连接池
- 添加慢查询日志（>1s 警告）
- 数据库健康检查接口

#### 6. 日志系统优化
- 启用日志压缩归档
- 分类日志文件（error/warn/http/combined）
- 增大日志文件大小限制

#### 7. 前端路由优化
- 完善权限守卫提示
- 添加 404 页面
- 支持登录后跳转原页面

#### 8. 请求防抖
- Token 刷新去重
- 批量操作数量限制

#### 9. 分页上限限制
- 最大 pageSize 限制为 100
- 参数类型验证

### 📊 代码质量优化

#### 10. 错误处理中间件
- 统一错误处理 `errorHandler`
- 统一 404 处理 `notFoundHandler`
- 错误码标准化

#### 11. 参数验证
- 使用 `express-validator` 进行参数验证
- 统一验证中间件 `handleValidationErrors`
- 分页参数规范化 `validatePagination`

#### 12. 健康检查增强
- 检查数据库连接状态
- 内存使用情况
- 响应时间统计

#### 13. 登录安全
- 登录失败锁定机制（5次失败锁定30分钟）

### 🐛 Bug 修复

#### 15. 前端登录 refreshToken 处理
- 登录成功后正确保存 refreshToken
- 支持登录后跳转到原页面

#### 16. 前端批量导入 API 修复
- 修复 importProducts 函数签名错误
- 正确使用 FormData 格式上传文件

#### 17. 忘记密码安全性
- 移除用户名枚举风险，不再暴露手机号是否注册
- 统一返回成功消息，防止信息泄露

#### 18. 日志敏感数据过滤
- 扩展敏感字段列表
- 使用 `***REDACTED***` 替代敏感数据

#### 19. 参数验证增强
- 所有 parseInt 添加 NaN 检查
- 添加 ID 正整数验证

#### 20. 批量删除后端限制
- 添加单次删除上限（100条）
- 防止前端限制被绕过

### 📱 短信验证码功能

#### 21. 阿里云短信集成
- 新增 `smsService.js` 短信发送服务
- 支持 6 位数字验证码
- 验证码 5 分钟有效期
- 验证失败 3 次自动失效

#### 22. 注册短信验证
- 注册前需先获取手机验证码
- 验证手机号是否已注册
- 新增 `/api/auth/sms/register` 接口

#### 23. 密码重置短信验证
- 重置密码需短信验证码验证
- 防止未授权密码重置
- 新增 `/api/auth/sms/reset` 接口

#### 24. 短信发送频率限制
- 15 分钟内最多发送 5 条
- 同一手机号 60 秒内只能发送 1 条
- 开发环境支持模拟验证码（123456）

#### 25. 前端验证码组件
- 注册页面添加验证码输入
- 忘记密码页面添加验证码输入
- 60 秒倒计时重发按钮

### 🔧 Redis 支持

#### 26. Redis 集成
- 新增 Redis 连接管理 (`config/redis.js`)
- 自动降级到内存存储（当 Redis 不可用时）
- 验证码存储迁移到 Redis
- 登录失败计数器迁移到 Redis
- 支持 Redis 配置从环境变量读取

#### 27. 请求重试机制
- 网络错误自动重试（默认 0 次，可配置）
- Token 过期自动刷新并重试
- 可配置重试次数和延迟

### 📦 轻量化优化

#### 28. Element Plus 按需引入
- 使用 `unplugin-auto-import` 和 `unplugin-vue-components`
- 移除全量引入，减少打包体积
- 优化 Vite 配置，启用 gzip 压缩
- 代码分包策略优化

#### 29. 构建优化
- 生产环境移除 console.log 和 debugger
- 分包策略：`vue`、`elementPlus`、`echarts`、`xlsx` 单独打包
- 启用压缩大小报告

#### 14. CORS 配置优化
- 支持多域名配置
- 生产环境警告

### 📁 新增文件

```
backend/
├── API.md                    # API 文档
├── .env.example              # 环境变量示例
└── prisma/
    └── migrate-data.js       # 数据迁移脚本

frontend/
├── src/
│   ├── styles/
│   │   └── global.css        # 全局样式
│   └── views/
│       └── NotFound.vue      # 404 页面
```

### 🔄 修改文件

```
backend/
├── package.json              # 添加 express-validator
├── prisma/schema.prisma      # 数据库 Schema 优化
└── src/
    ├── app.js                # 应用入口优化
    ├── config/
    │   ├── index.js          # 配置验证
    │   └── database.js       # 数据库配置优化
    ├── middleware/
    │   ├── auth.js           # 认证中间件优化
    │   └── validation.js     # 新增验证中间件
    ├── services/
    │   ├── authService.js    # 认证服务优化
    │   └── productService.js # 商品服务优化
    ├── routes/
    │   ├── auth.js           # 路由验证
    │   └── products.js       # 路由验证
    └── utils/
        ├── logger.js         # 日志优化
        └── upload.js         # 上传安全优化

frontend/
└── src/
    ├── main.ts               # 入口优化
    ├── router/index.ts       # 路由守卫优化
    ├── stores/user.ts        # 状态管理优化
    ├── api/auth.ts           # API 优化
    └── utils/request.ts      # HTTP 客户端优化
```

### 📋 升级指南

1. **安装新依赖**
   ```bash
   cd backend
   npm install
   ```

2. **运行数据库迁移**
   ```bash
   npx prisma migrate dev --name add_expiry_date_and_status
   ```

3. **迁移现有数据**（如果有）
   ```bash
   node prisma/migrate-data.js
   ```

4. **更新环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置 JWT_SECRET 等配置
   ```

5. **重启服务**
   ```bash
   npm run dev
   ```

### ⚠️ 破坏性变更

1. **数据库 Schema 变更**
   - 新增 `expiryDate` 和 `status` 字段
   - 需要运行迁移脚本

2. **JWT Secret 验证**
   - 生产环境必须设置 `JWT_SECRET`（至少 32 字符）
   - 否则服务无法启动

3. **API 响应格式**
   - 错误响应新增 `code` 字段
   - 验证错误返回 `errors` 数组

4. **分页限制**
   - `pageSize` 最大值从无限制改为 100
