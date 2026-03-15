# 📦 商品保质期管理系统

一个简洁实用的商品保质期管理工具，帮助您追踪商品有效期，避免浪费。

## ✨ 功能特性

### 📋 商品管理
- 添加、编辑、删除商品
- 支持条码扫描快速录入
- 批量导入（Excel/CSV）
- 批量编辑、批量删除
- 商品分类管理

### ⏰ 过期提醒
- 自定义每件商品的提醒天数
- 短信提醒（阿里云短信）
- 飞书群机器人推送
- 支持多个提醒手机号
- 定时自动检查（每日 9:00）

### 📊 数据统计
- 首页仪表盘概览
- 商品状态分布图表
- 分类统计
- 即将过期商品预警

### 🔐 用户系统
- 用户注册/登录
- JWT Token 认证
- 登录失败锁定保护
- Token 自动刷新

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Element Plus + Vite |
| 后端 | Node.js + Express + Prisma ORM |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis（可选，未配置时自动降级为内存存储） |
| 部署 | Docker / PM2 |

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/iGewen/expiry-management-system.git
cd expiry-management-system

# 2. 配置环境变量
cp .env.docker.example .env
# 编辑 .env，设置 JWT_SECRET 等关键配置

# 3. 启动服务
docker-compose up -d

# 4. 访问系统
# 前端：http://localhost
# 后端：http://localhost:3000
```

详细说明请查看 [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)

### 方式二：手动部署

#### 环境要求
- Node.js 18+
- MySQL 8.0+
- Redis（可选）

#### 步骤

```bash
# 1. 克隆项目
git clone https://github.com/iGewen/expiry-management-system.git
cd expiry-management-system

# 2. 配置后端
cd backend
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 3. 安装依赖
npm install

# 4. 数据库迁移
npx prisma migrate deploy

# 5. 启动后端
npm run dev  # 开发模式
# 或
pm2 start src/app.js --name expiry-backend  # 生产模式

# 6. 启动前端（新终端）
cd ../frontend
npm install
npm run dev  # 开发模式
# 或
npm run build  # 构建生产版本
```

## ⚙️ 配置说明

### 必需配置

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | MySQL 连接字符串 |
| `JWT_SECRET` | JWT 密钥（至少32位） |

### 可选配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `REDIS_HOST` | Redis 地址 | 无（使用内存） |
| `REDIS_PASSWORD` | Redis 密码 | - |
| `CORS_ORIGIN` | 允许跨域域名 | localhost |
| `ALIYUN_ACCESS_KEY_ID` | 阿里云 AccessKey | 无（禁用短信） |
| `ALIYUN_SMS_SIGN_NAME` | 短信签名 | - |

### 飞书机器人配置

1. 在飞书群中添加「自定义机器人」
2. 获取 Webhook 地址
3. 在系统「提醒设置」中配置

## 📁 项目结构

```
expiry-management-system/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── api/            # API 接口
│   │   ├── stores/         # Pinia 状态
│   │   └── router/         # 路由配置
│   └── Dockerfile
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── middleware/     # 中间件
│   │   └── config/         # 配置
│   ├── prisma/             # 数据库模型
│   └── Dockerfile
├── docker-compose.yml      # Docker 编排
└── README.md
```

## 🔒 安全特性

- ✅ JWT Token 认证 + 自动刷新
- ✅ 密码 bcrypt 加密
- ✅ 登录失败锁定（5次失败锁定30分钟）
- ✅ 验证码尝试次数限制（最多5次）
- ✅ 防用户枚举攻击
- ✅ 请求频率限制
- ✅ 日志脱敏（手机号隐藏中间4位）

## 📸 截图

> 首页仪表盘显示商品状态概览和即将过期商品列表

> 商品管理页面支持搜索、筛选、批量操作

> 提醒设置页面可配置手机号和飞书机器人

## 📄 许可证

GPL-3.0 License

## 👤 作者

HeHaiFeng GeWen

---

**💡 提示**：生产环境部署请务必修改默认密码和 JWT 密钥！
