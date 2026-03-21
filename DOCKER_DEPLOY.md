# Docker 部署指南

## 环境要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 能够访问阿里云 Container Registry (ACR)

## 快速开始

### 1. 克隆代码

```bash
git clone https://github.com/iGewen/expiry-management-system.git
cd expiry-management-system
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
nano .env
```

**必须修改的配置**：

| 变量 | 说明 | 示例 |
|------|------|------|
| `MYSQL_ROOT_PASSWORD` | MySQL Root 密码 | `openssl rand -base64 16` |
| `MYSQL_PASSWORD` | 数据库用户密码 | `openssl rand -base64 16` |
| `REDIS_PASSWORD` | Redis 密码 | `openssl rand -base64 16` |
| `JWT_SECRET` | JWT 密钥 | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | JWT 刷新密钥 | `openssl rand -base64 32` |
| `CORS_ORIGIN` | 前端访问地址 | `http://你的服务器IP` |

### 3. 登录阿里云 ACR

```bash
docker login --username=你的阿里云账号 crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com
```

> 密码：你在阿里云设置的密码

### 4. 启动服务

```bash
docker-compose up -d --build
```

### 5. 验证部署

```bash
# 查看容器状态
docker ps

# 查看服务日志
docker-compose logs -f
```

### 6. 访问系统

- 前端界面：http://你的服务器IP
- 后端 API：http://你的服务器IP/api
- 健康检查：http://你的服务器IP/api/health

---

## 镜像说明

### 阿里云 ACR 镜像配置

项目默认配置为阿里云 ACR 镜像，如需修改 编辑 `.env`：

```bash
# 镜像地址（根据你的ACR配置修改）
MYSQL_IMAGE=crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/mysql:8.0
REDIS_IMAGE=crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/redis:7-alpine
NODE_IMAGE=crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/node:lts
NGINX_IMAGE=crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/nginx:latest
```

### 自定义镜像

如需使用其他镜像源，修改 `docker-compose.yml` 中的镜像地址：

```yaml
services:
  mysql:
    image: mysql:8.0  # 可改为其他镜像源
  redis:
    image: redis:7-alpine
  nginx:
    image: nginx:alpine
```

---

## 常用命令

### 启动/停止

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 停止并删除数据卷（会删除所有数据！）
docker-compose down -v

# 重启指定服务
docker-compose restart backend
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend

# 查看 Nginx 日志
docker-compose logs -f nginx
```

### 容器操作

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入数据库容器
docker-compose exec mysql mysql -uroot -p

# 进入 Redis 容器
docker-compose exec redis redis-cli
```

### 数据库操作

```bash
# 执行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 生成 Prisma Client
docker-compose exec backend npx prisma generate

# 备份数据库
docker-compose exec mysql mysqldump -uexpiry_user -p expiry_management > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -uexpiry_user -p expiry_management < backup.sql
```

---

## 生产环境部署

### 1. 配置强密码

编辑 `.env` 文件：

```bash
# 使用 openssl 生成强密码
openssl rand -base64 16  # MySQL/Redis 密码
openssl rand -base64 32  # JWT 密钥
```

### 2. 配置 HTTPS

项目已配置 Nginx 反向代理，支持 HTTP/HTTPS：

```bash
# 生成自签名证书（测试用）
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/nginx.key \
  -out nginx/ssl/nginx.crt \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Company/CN=你的服务器IP"
```

### 3. 修改端口或域名

编辑 `docker-compose.yml`：

```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
```

### 4. 数据持久化

数据默认存储在 Docker volumes：

- `mysql_data`：MySQL 数据
- `redis_data`：Redis 数据

如需备份到宿主机目录：

```yaml
volumes:
  mysql_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/mysql
```

---

## 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose up -d --build

# 执行数据库迁移（如有更新）
docker-compose exec backend npx prisma migrate deploy

# 清理旧镜像
docker image prune -f
```

---

## 故障排查

### 后端启动失败

```bash
# 查看后端日志
docker-compose logs backend

# 常见原因：
# 1. 数据库未就绪 - 等待 MySQL 启动
docker-compose restart backend

# 2. 数据库未初始化
docker-compose exec backend npx prisma migrate deploy

# 3. 环境变量未配置
cat .env
```

### Redis 连接失败

```bash
# 检查 Redis 状态
docker-compose exec redis redis-cli ping

# 带密码检查
docker-compose exec redis redis-cli -a 你的密码 ping
```

### 端口冲突

```bash
# 查看端口占用
netstat -tlnp | grep -E '80|443|3000|3306|6379'

# 修改 docker-compose.yml 中的端口映射
```

### 镜像拉取失败

```bash
# 检查 ACR 登录状态
docker login --username=你的账号 crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com

# 手动拉取镜像测试
docker pull crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/mysql:8.0
```

---

## 目录结构

```
expiry-management-system/
├── backend/                 # 后端服务
│   ├── src/               # 源代码
│   ├── prisma/            # 数据库模型
│   ├── Dockerfile         # 后端镜像构建
│   └── package.json
├── frontend/               # 前端服务
│   ├── src/               # 源代码
│   ├── public/            # 静态资源
│   ├── Dockerfile         # 前端镜像构建
│   └── package.json
├── nginx/                 # Nginx 配置
│   ├── nginx.conf         # Nginx 配置
│   └── ssl/               # SSL 证书
├── docker-compose.yml     # 容器编排
├── .env.example          # 环境变量模板
└── README.md
```

---

## 环境变量参考

```bash
# ========== 镜像配置（使用阿里云ACR） ==========
MYSQL_IMAGE=crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/mysql:8.0
REDIS_IMAGE=crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/redis:7-alpine
NODE_IMAGE=crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/node:lts
NGINX_IMAGE=crpi-h8wdp3y1iogi9wj4.cn-qingdao.personal.cr.aliyuncs.com/ihee_docker_project/nginx:latest

# ========== 数据库配置 ==========
MYSQL_ROOT_PASSWORD=你的强密码
MYSQL_DATABASE=expiry_management
MYSQL_USER=expiry_user
MYSQL_PASSWORD=你的强密码

# ========== Redis配置 ==========
REDIS_PASSWORD=你的强密码

# ========== JWT配置 ==========
JWT_SECRET=你的64位强密钥
JWT_REFRESH_SECRET=你的64位强密钥

# ========== CORS配置 ==========
CORS_ORIGIN=http://你的服务器IP

# ========== 飞书配置（可选） ==========
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_REDIRECT_URI=

# ========== 阿里云短信配置（可选） ==========
ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
ALIYUN_SMS_SIGN_NAME=
ALIYUN_SMS_TEMPLATE_CODE_REGISTER=
ALIYUN_SMS_TEMPLATE_CODE_RESET=
ALIYUN_SMS_TEMPLATE_CODE_REMINDER=
```
