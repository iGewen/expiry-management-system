# 商品保质期管理系统 (优化版)

一个基于 Vue3 + TypeScript + Express + MySQL/MariaDB 的全栈商品保质期管理系统。

## ✨ 优化亮点

### 🔒 安全性增强
- JWT 生产环境强制验证
- 文件上传魔数检测
- 登录失败锁定机制
- Refresh Token 自动刷新

### 🚀 性能优化
- 数据库复合索引
- 查询从内存过滤改为 SQL 查询
- 统计使用聚合函数
- 分页上限限制

### 🛡️ 稳定性提升
- 全局错误处理中间件
- 数据库事务保护
- 优雅关闭连接
- 健康检查端点

### 📊 开发体验
- 完整的 API 文档
- 参数验证中间件
- 统一的错误码
- 日志分类归档

## 🏗️ 技术栈

### 前端
- Vue 3 + TypeScript
- Element Plus (UI组件库)
- Pinia (状态管理)
- Vue Router 4 (路由)
- ECharts 5 (数据可视化)
- Axios (HTTP请求)
- Vite (构建工具)

### 后端
- Node.js 20+
- Express 4
- Prisma 5 (ORM)
- MySQL/MariaDB
- JWT + bcrypt
- express-validator
- Winston (日志)

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/iGewen/expiry-management-system.git
cd expiry-management-system
```

### 2. 配置环境变量
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，配置数据库和 JWT_SECRET
```

### 3. 安装依赖
```bash
# 后端
npm install

# 前端
cd ../frontend
npm install
```

### 4. 数据库迁移
```bash
cd ../backend
npx prisma migrate dev
```

### 5. 启动开发服务器
```bash
# 后端
npm run dev

# 前端（新终端）
cd ../frontend
npm run dev
```

## 📝 API 文档

详见 [API.md](./backend/API.md)

## 📋 变更日志

详见 [CHANGELOG.md](./CHANGELOG.md)

## 🛠️ 部署

### 一键部署
```bash
cd /var/www/expiry-management-system
sudo bash deploy.sh
```

### 手动部署

#### 构建前端
```bash
cd frontend
npm run build
# 输出到 dist 目录
```

#### 使用 PM2 管理后端
```bash
cd backend
npm install -g pm2
pm2 start src/app.js --name expiry-backend
pm2 save
pm2 startup
```

## 📊 系统架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │─────▶│    Nginx    │─────▶│   Backend   │
│  (Vue3 SPA) │◀─────│  (Reverse   │◀─────│  (Express)  │
└─────────────┘      │    Proxy)   │      └─────────────┘
                     └─────────────┘             │
                                                  │
                                                  ▼
                                         ┌─────────────┐
                                         │   MariaDB   │
                                         │  (Database)  │
                                         └─────────────┘
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| DATABASE_URL | 数据库连接字符串 | - |
| JWT_SECRET | JWT 密钥（生产环境必须设置） | - |
| JWT_EXPIRES_IN | Token 过期时间 | 7d |
| CORS_ORIGIN | 允许跨域的域名 | http://localhost:5173 |
| LOG_LEVEL | 日志级别 | info |
| UPLOAD_MAX_SIZE | 文件上传大小限制 | 10485760 (10MB) |

## 🧪 测试

```bash
# 后端测试
cd backend
npm test

# 代码检查
npm run lint
```

## 📈 性能指标

- 分页查询: < 100ms (1000条数据)
- 批量导入: 支持 1000 条/次
- 统计查询: < 200ms (10万条数据)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

GPL-3.0 license

## 👥 作者

HeHaiFeng GeWen

---

**⚠️ 安全提示**: 生产环境使用前请修改默认配置并设置强密码！
