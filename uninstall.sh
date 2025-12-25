#!/bin/bash

#==============================================================================
# 商品保质期管理系统 - 卸载脚本
#==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo ""
echo -e "${RED}警告: 此操作将删除所有数据和配置！${NC}"
echo ""
read -p "确定要卸载吗？(输入 YES 继续): " confirm

if [ "$confirm" != "YES" ]; then
    print_warning "取消卸载"
    exit 0
fi

echo ""
print_warning "开始卸载..."

# 停止服务
print_warning "停止服务..."
pm2 delete expiry-backend 2>/dev/null || true
systemctl stop nginx

# 删除 Nginx 配置
rm -f /etc/nginx/sites-enabled/expiry-management
rm -f /etc/nginx/sites-available/expiry-management
systemctl restart nginx

# 删除数据库
if [ -f "/var/www/expiry-management-system/deployment-info.txt" ]; then
    DB_NAME=$(grep "数据库名:" /var/www/expiry-management-system/deployment-info.txt | awk '{print $2}')
    DB_USER=$(grep "用户名:" /var/www/expiry-management-system/deployment-info.txt | grep -A 1 "数据库信息" | tail -1 | awk '{print $2}')
    
    if [ -n "$DB_NAME" ]; then
        mysql -u root -e "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
        mysql -u root -e "DROP USER IF EXISTS '$DB_USER'@'localhost';" 2>/dev/null || true
        print_success "数据库已删除"
    fi
fi

print_success "卸载完成"
echo ""
print_warning "注意: 项目文件和依赖仍保留在 /var/www/expiry-management-system"
print_warning "如需完全删除，请手动执行: rm -rf /var/www/expiry-management-system"
