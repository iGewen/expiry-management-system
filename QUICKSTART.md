# 快速启动指南

## 📋 当前系统状态

✅ 已完成：
- 后端框架和核心模块（认证、商品管理、日志、用户管理）
- 前端框架和基础页面（登录、注册、忘记密码、主布局）
- 数据库设计（Prisma Schema）
- API 接口封装
- 路由和状态管理

⏳ 待完成（前端页面详细实现）：
- 仪表盘数据可视化
- 商品管理完整功能
- 数据统计图表
- 导入导出界面
- 日志审计界面
- 用户设置界面
- 管理员界面

## 🚀 启动步骤

### 1. 安装依赖

**后端：**
```bash
cd /var/www/expiry-management-system/backend
npm install
```

**前端：**
```bash
cd /var/www/expiry-management-system/frontend
npm install
```

### 2. 配置数据库

确保你已经安装了 MySQL 或 MariaDB，然后创建数据库：

```sql
CREATE DATABASE expiry_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改后端 `.env` 文件中的数据库连接：
```
DATABASE_URL="mysql://root:@localhost:3306/expiry_management"
```

### 3. 初始化数据库

```bash
cd /var/www/expiry-management-system/backend
npx prisma generate
npx prisma migrate dev --name init
```

### 4. 启动服务

**终端 1 - 启动后端：**
```bash
cd /var/www/expiry-management-system/backend
npm run dev
```

**终端 2 - 启动前端：**
```bash
cd /var/www/expiry-management-system/frontend
npm run dev
```

### 5. 访问系统

打开浏览器访问：http://localhost:5173

首先注册一个账号，然后即可登录使用。

## 📝 如何创建管理员账号

1. 先注册一个普通用户
2. 在数据库中修改用户角色：

```sql
-- 查看所有用户
SELECT * FROM users;

-- 设置为管理员
UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';

-- 或设置为超级管理员
UPDATE users SET role = 'SUPER_ADMIN' WHERE username = 'your_username';
```

## 🔍 测试 API

可以使用以下工具测试后端 API：
- Postman
- curl
- 浏览器访问 http://localhost:3000/health

示例：
```bash
# 健康检查
curl http://localhost:3000/health

# 注册用户
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "confirmPassword": "test123",
    "phone": "13800138000"
  }'

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'
```

## ⚠️ 常见问题

### 问题 1：Node.js 未安装
解决方案：
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 问题 2：数据库连接失败
- 确保 MySQL/MariaDB 正在运行
- 检查 .env 文件中的数据库配置
- 验证数据库用户权限

### 问题 3：端口被占用
- 后端默认端口：3000
- 前端默认端口：5173
- 可以在配置文件中修改

### 问题 4：依赖安装失败
尝试使用国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com
```

## 📚 下一步

1. 根据需求实现剩余的前端页面
2. 添加更多的数据验证
3. 完善错误处理
4. 添加单元测试
5. 优化性能
6. 添加更多功能特性

## 📞 技术支持

如有问题，请参考：
- README.md - 完整文档
- 原始需求文档 - 商品保质期管理系统 - 项目开发文档.md
- Prisma 文档：https://www.prisma.io/docs
- Vue 3 文档：https://cn.vuejs.org
- Element Plus 文档：https://element-plus.org/zh-CN
