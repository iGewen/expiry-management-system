# 部署脚本使用指南

## 🚀 快速部署

### 1. 运行部署脚本

```bash
cd /var/www/expiry-management-system
sudo bash deploy.sh
```

### 2. 按提示输入配置信息

脚本会依次询问以下信息：

#### 域名配置
- **域名**：如果有域名请输入（如：example.com），否则留空使用服务器IP
- **SSL证书**：如果使用域名，可选择申请免费的 Let's Encrypt 证书
- **管理员邮箱**：申请SSL证书时需要

#### 端口配置
- **前端端口**：默认 80（如使用SSL则自动为443）
- **后端端口**：默认 3000

#### 数据库配置
- **数据库名**：默认 expiry_management
- **数据库用户名**：默认 expiry_user
- **数据库密码**：留空则自动生成

#### 超级管理员账号
- **用户名**：自定义
- **密码**：至少6位，需包含字母和数字
- **手机号**：11位手机号

### 3. 确认配置并开始安装

脚本会显示所有配置信息供确认，确认无误后开始自动安装。

## 📋 脚本功能

### 自动完成的任务

1. **系统检测**
   - 检查操作系统
   - 检查root权限
   - 检查网络连接
   - 更新软件包列表

2. **依赖安装**
   - Node.js 18.x
   - Nginx
   - MariaDB
   - PM2
   - Certbot（如启用SSL）

3. **数据库配置**
   - 创建数据库
   - 创建数据库用户
   - 设置权限

4. **后端配置**
   - 生成环境配置文件
   - 安装npm依赖
   - 运行数据库迁移
   - 使用PM2启动服务

5. **前端配置**
   - 安装npm依赖
   - 构建生产版本

6. **Nginx配置**
   - 配置反向代理
   - 启用Gzip压缩
   - 设置缓存策略
   - 配置文件上传限制

7. **SSL配置**（可选）
   - 申请Let's Encrypt证书
   - 配置HTTPS
   - 设置HTTP到HTTPS重定向
   - 配置证书自动续期

8. **系统初始化**
   - 创建超级管理员账号
   - 健康检查
   - 保存部署信息

## 📁 部署后文件

部署完成后会在项目根目录生成：

```
deployment-info.txt  # 部署信息（包含密码等敏感信息）
```

**重要：请妥善保管此文件！**

## 🔧 服务管理

### 后端服务（PM2）

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs expiry-backend

# 实时日志
pm2 logs expiry-backend --lines 100

# 重启服务
pm2 restart expiry-backend

# 停止服务
pm2 stop expiry-backend

# 启动服务
pm2 start expiry-backend
```

### Nginx

```bash
# 查看状态
systemctl status nginx

# 重启
systemctl restart nginx

# 测试配置
nginx -t

# 重新加载配置
systemctl reload nginx
```

### 数据库

```bash
# 登录数据库
mysql -u expiry_user -p

# 备份数据库
mysqldump -u expiry_user -p expiry_management > backup.sql

# 恢复数据库
mysql -u expiry_user -p expiry_management < backup.sql
```

## 🗑️ 卸载

```bash
cd /var/www/expiry-management-system
sudo bash uninstall.sh
```

卸载脚本会：
- 停止所有服务
- 删除Nginx配置
- 删除数据库和用户
- 保留项目文件（需手动删除）

完全删除项目：
```bash
rm -rf /var/www/expiry-management-system
```

## 🔍 故障排查

### 后端无法启动

```bash
# 查看PM2日志
pm2 logs expiry-backend --err

# 查看后端错误日志
cat /var/www/expiry-management-system/backend/logs/error.log

# 检查端口占用
netstat -tlnp | grep 3000

# 手动启动测试
cd /var/www/expiry-management-system/backend
node src/app.js
```

### 前端无法访问

```bash
# 检查Nginx配置
nginx -t

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log

# 检查前端构建文件
ls -la /var/www/expiry-management-system/frontend/dist
```

### 数据库连接失败

```bash
# 测试数据库连接
mysql -u expiry_user -p expiry_management

# 检查数据库服务
systemctl status mariadb

# 查看数据库日志
tail -f /var/log/mysql/error.log
```

### SSL证书问题

```bash
# 手动续期
certbot renew

# 测试续期
certbot renew --dry-run

# 查看证书信息
certbot certificates
```

## 💡 优化建议

### 1. 数据库优化

编辑 `/etc/mysql/mariadb.conf.d/50-server.cnf`：

```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 256M
query_cache_size = 32M
```

重启MariaDB：
```bash
systemctl restart mariadb
```

### 2. Nginx优化

编辑 `/etc/nginx/nginx.conf`：

```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
```

### 3. PM2优化

```bash
# 设置集群模式（多进程）
pm2 start ecosystem.config.js -i 2

# 设置内存限制
pm2 start ecosystem.config.js --max-memory-restart 500M
```

### 4. 系统优化

```bash
# 设置时区
timedatectl set-timezone Asia/Shanghai

# 启用防火墙
ufw enable
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
```

## 📊 监控

### 1. 服务器监控

```bash
# 安装监控工具
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# 设置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. 应用监控

访问PM2监控面板：
```bash
pm2 monit
```

### 3. 日志查看

```bash
# 实时查看所有日志
pm2 logs

# 查看访问日志
tail -f /var/log/nginx/access.log
```

## 🔐 安全建议

1. **修改默认密码**
   - 定期修改数据库密码
   - 定期修改管理员密码

2. **启用防火墙**
   ```bash
   ufw enable
   ufw allow 80,443/tcp
   ```

3. **定期备份**
   - 设置自动备份数据库
   - 备份上传的文件

4. **监控日志**
   - 定期检查错误日志
   - 关注异常访问

5. **更新系统**
   ```bash
   apt-get update && apt-get upgrade
   ```

## 📞 支持

如遇问题，请查看：
- 部署日志：终端输出
- 后端日志：`/var/www/expiry-management-system/backend/logs/`
- Nginx日志：`/var/log/nginx/`
- 系统日志：`/var/log/syslog`
