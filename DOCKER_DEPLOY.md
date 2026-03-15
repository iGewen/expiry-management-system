# Docker 部署指南

## 快速开始

### 1. 环境准备

确保已安装：
- Docker Engine 20.10+
- Docker Compose 2.0+

### 2. 克隆代码

```bash
git clone https://github.com/iGewen/expiry-management-system.git
cd expiry-management-system
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker.example .env

# 编辑 .env 文件，设置必要的配置
vim .env
```

**关键配置项**：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MYSQL_PASSWORD` | MySQL 用户密码 | expiry123456 |
| `REDIS_PASSWORD` | Redis 密码 | redis123456 |
| `JWT_SECRET` | JWT 密钥（必须修改！） | - |
| `CORS_ORIGIN` | 前端域名 | http://localhost |

### 4. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 5. 初始化数据库

首次启动后，需要初始化数据库：

```bash
# 执行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 或初始化数据（如果需要）
docker-compose exec backend npx prisma db seed
```

### 6. 访问系统

- 前端界面：http://localhost
- 后端 API：http://localhost:3000/api
- 健康检查：http://localhost:3000/health

---

## 常用命令

```bash
# 停止服务
docker-compose down

# 停止并删除数据卷（会删除所有数据！）
docker-compose down -v

# 重启服务
docker-compose restart

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend

# 进入后端容器
docker-compose exec backend sh

# 进入数据库容器
docker-compose exec mysql mysql -uexpiry_user -p

# 备份数据库
docker-compose exec mysql mysqldump -uexpiry_user -p expiry_management > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -uexpiry_user -p expiry_management < backup.sql
```

---

## 生产环境部署

### 1. 修改配置

编辑 `.env` 文件：

```bash
# 使用强密码
MYSQL_ROOT_PASSWORD=your-strong-root-password
MYSQL_PASSWORD=your-strong-db-password
REDIS_PASSWORD=your-strong-redis-password

# JWT 密钥（至少32位随机字符）
JWT_SECRET=your-super-secret-jwt-key-$(openssl rand -hex 32)

# 修改为实际域名
CORS_ORIGIN=https://your-domain.com

# 阿里云短信配置（如需短信功能）
ALIYUN_ACCESS_KEY_ID=your-ak
ALIYUN_ACCESS_KEY_SECRET=your-sk
ALIYUN_SMS_SIGN_NAME=你的签名
```

### 2. 使用 HTTPS

方案1：使用 Nginx 反向代理 + Let's Encrypt

```yaml
# 在 docker-compose.yml 中添加
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/nginx.prod.conf:/etc/nginx/conf.d/default.conf
```

方案2：使用 Cloudflare Tunnel / Nginx Proxy Manager

### 3. 数据持久化

数据默认存储在 Docker volumes：
- `mysql_data`：MySQL 数据
- `redis_data`：Redis 数据

如需备份到外部的目录：

```yaml
volumes:
  mysql_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/mysql
```

### 4. 监控与日志

```bash
# 查看资源使用
docker stats

# 限制容器资源（在 docker-compose.yml 中）
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

---

## 故障排查

### 后端启动失败

```bash
# 检查日志
docker-compose logs backend

# 常见原因：
# 1. 数据库连接失败 - 等待 MySQL 完全启动
docker-compose restart backend

# 2. 数据库未初始化
docker-compose exec backend npx prisma migrate deploy
```

### Redis 连接失败

```bash
# 检查 Redis 状态
docker-compose exec redis redis-cli ping

# 如果配置了密码
docker-compose exec redis redis-cli -a your-password ping
```

### 端口冲突

```bash
# 修改端口映射（docker-compose.yml）
services:
  frontend:
    ports:
      - "8080:80"  # 改为 8080 端口
  backend:
    ports:
      - "3001:3000"  # 改为 3001 端口
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

## 数据备份策略

### 自动备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/backup/expiry-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T mysql mysqldump -uexpiry_user -p${MYSQL_PASSWORD} expiry_management > $BACKUP_DIR/db.sql

# 备份 Redis
docker-compose exec redis redis-cli -a ${REDIS_PASSWORD} SAVE
docker cp expiry-redis:/data/dump.rdb $BACKUP_DIR/redis.rdb

# 压缩并上传（可选）
tar czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR
```

添加到 crontab：

```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```
