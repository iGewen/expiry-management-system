#!/bin/bash

#==============================================================================
# 商品保质期管理系统 - 交互式部署脚本
# 作者: Hehaifeng GeWen
# 版本: 1.0.0
# 日期: 2025-12-24
#==============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 项目路径
PROJECT_ROOT="/var/www/expiry-management-system"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 配置变量
declare -A CONFIG

# 系统信息
OS_TYPE=""
PACKAGE_MANAGER=""
SERVICE_MANAGER="systemd"
MARIADB_SERVICE=""  # MariaDB 服务名称

#==============================================================================
# 工具函数
#==============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}================================================${NC}"
    echo -e "${BLUE}${BOLD}  $1${NC}"
    echo -e "${BLUE}${BOLD}================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

confirm() {
    read -p "$(echo -e ${YELLOW}$1 [y/N]: ${NC})" response
    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

#==============================================================================
# 欢迎界面
#==============================================================================

show_welcome() {
    clear
    print_header "商品保质期管理系统 - 自动部署脚本"
    
    cat << "EOF"
  _____ _____ ________          ________ _   _ 
 |_   _/ ____|  ____\ \        / /  ____| \ | |
   | || |  __| |__   \ \  /\  / /| |__  |  \| |
   | || | |_ |  __|   \ \/  \/ / |  __| | . ` |
  _| || |__| | |____   \  /\  /  | |____| |\  |
 |_____\_____|______|   \/  \/   |______|_| \_|
                                               
EOF
    
    echo "===================================="
    print_info "本脚本将帮助您完成以下任务："
    echo "  • 系统环境检测和依赖安装"
    echo "  • 数据库安装和配置"
    echo "  • Nginx 安装和反向代理配置"
    echo "  • SSL 证书申请（可选）"
    echo "  • 项目依赖安装和构建"
    echo "  • 创建超级管理员账号"
    echo "  • PM2 进程管理配置"
    echo "  • 服务健康检查"
    echo "===================================="
    
    if ! confirm "是否继续部署？"; then
        print_warning "部署已取消"
        exit 0
    fi
}

#==============================================================================
# 检测 MariaDB 服务名称
#==============================================================================

detect_mariadb_service() {
    # 尝试不同的服务名称
    if systemctl list-unit-files | grep -q "^mariadb.service"; then
        MARIADB_SERVICE="mariadb"
    elif systemctl list-unit-files | grep -q "^mysql.service"; then
        MARIADB_SERVICE="mysql"
    elif systemctl list-unit-files | grep -q "^mysqld.service"; then
        MARIADB_SERVICE="mysqld"
    else
        print_error "无法找到 MariaDB/MySQL 服务"
        print_info "正在查找可用的数据库服务..."
        systemctl list-unit-files | grep -iE "mysql|maria" || echo "  未找到任何数据库服务"
        
        print_info "检查已安装的数据库包..."
        case "$OS_TYPE" in
            debian)
                dpkg -l | grep -iE "mariadb|mysql" || echo "  未找到数据库包"
                ;;
            rhel|fedora|suse)
                rpm -qa | grep -iE "mariadb|mysql" || echo "  未找到数据库包"
                ;;
            arch)
                pacman -Q | grep -iE "mariadb|mysql" || echo "  未找到数据库包"
                ;;
        esac
        
        print_warning "尝试手动创建服务链接..."
        # 查找可能的服务文件位置
        for service_file in /usr/lib/systemd/system/mariadb.service \
                           /usr/lib/systemd/system/mysql.service \
                           /usr/lib/systemd/system/mysqld.service \
                           /lib/systemd/system/mariadb.service \
                           /lib/systemd/system/mysql.service; do
            if [ -f "$service_file" ]; then
                service_name=$(basename "$service_file" .service)
                print_info "找到服务文件: $service_file"
                systemctl daemon-reload
                MARIADB_SERVICE="$service_name"
                print_success "使用服务: $MARIADB_SERVICE"
                return 0
            fi
        done
        
        return 1
    fi
    
    print_success "检测到数据库服务名称: $MARIADB_SERVICE"
    return 0
}

#==============================================================================
# 检测操作系统类型
#==============================================================================

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        case "$ID" in
            ubuntu|debian|linuxmint|pop)
                OS_TYPE="debian"
                PACKAGE_MANAGER="apt-get"
                ;;
            centos|rhel|rocky|almalinux)
                OS_TYPE="rhel"
                PACKAGE_MANAGER="yum"
                if command -v dnf &> /dev/null; then
                    PACKAGE_MANAGER="dnf"
                fi
                ;;
            fedora)
                OS_TYPE="fedora"
                PACKAGE_MANAGER="dnf"
                ;;
            arch|manjaro)
                OS_TYPE="arch"
                PACKAGE_MANAGER="pacman"
                ;;
            opensuse*|sles)
                OS_TYPE="suse"
                PACKAGE_MANAGER="zypper"
                ;;
            *)
                print_error "不支持的操作系统: $ID"
                print_info "支持的系统: Ubuntu, Debian, CentOS, RHEL, Rocky Linux, Fedora, Arch Linux, openSUSE"
                exit 1
                ;;
        esac
    else
        print_error "无法识别操作系统"
        exit 1
    fi
}

#==============================================================================
# 诊断 MariaDB 问题
#==============================================================================

diagnose_mariadb() {
    print_header "MariaDB 问题诊断"
    
    print_info "=== 系统信息 ==="
    echo "  操作系统: $OS_TYPE"
    echo "  包管理器: $PACKAGE_MANAGER"
    
    print_info "1. 检查可用的数据库服务"
    systemctl list-unit-files | grep -iE "mysql|maria" || echo "  未找到任何数据库服务"
    
    print_info "2. 检查已安装的数据库包"
    case "$OS_TYPE" in
        debian)
            dpkg -l | grep -iE "mariadb|mysql" || echo "  未安装数据库包"
            ;;
        rhel|fedora|suse)
            rpm -qa | grep -iE "mariadb|mysql" || echo "  未安装数据库包"
            ;;
        arch)
            pacman -Q | grep -iE "mariadb|mysql" || echo "  未安装数据库包"
            ;;
    esac
    
    print_info "3. 检查服务文件位置"
    for service_path in /usr/lib/systemd/system /lib/systemd/system /etc/systemd/system; do
        if [ -d "$service_path" ]; then
            echo "  检查 $service_path:"
            ls -la "$service_path" | grep -iE "mysql|maria" || echo "    未找到服务文件"
        fi
    done
    
    print_info "4. 检查 MariaDB 服务状态（尝试多个可能的服务名）"
    for service in mariadb mysql mysqld; do
        echo "  检查 $service:"
        systemctl status $service --no-pager 2>/dev/null || echo "    服务 $service 不存在"
    done
    
    print_info "5. 检查 MariaDB 进程"
    ps aux | grep -i mysql | grep -v grep || echo "  未找到 MySQL 进程"
    
    print_info "6. 检查数据目录"
    if [ -d "/var/lib/mysql" ]; then
        echo "  数据目录存在: /var/lib/mysql"
        ls -la /var/lib/mysql | head -10
        if [ -d "/var/lib/mysql/mysql" ]; then
            echo "  ✔ 数据库已初始化"
        else
            echo "  ✖ 数据库未初始化"
        fi
    else
        echo "  ✖ 数据目录不存在"
    fi
    
    print_info "7. 检查 mysql 用户和组"
    if id -u mysql &> /dev/null; then
        echo "  ✔ mysql 用户存在: $(id mysql)"
    else
        echo "  ✖ mysql 用户不存在"
    fi
    if getent group mysql &> /dev/null; then
        echo "  ✔ mysql 组存在"
    else
        echo "  ✖ mysql 组不存在"
    fi
    
    print_info "8. 检查 MariaDB 初始化命令"
    echo "  检查 mysql_install_db:"
    if command -v mysql_install_db &> /dev/null; then
        echo "    ✔ $(which mysql_install_db)"
    else
        echo "    ✖ 未找到"
        find /usr -name "mysql_install_db" 2>/dev/null | head -3 || echo "    无任何结果"
    fi
    echo "  检查 mysqld:"
    if command -v mysqld &> /dev/null; then
        echo "    ✔ $(which mysqld)"
    else
        echo "    ✖ 未找到"
        find /usr -name "mysqld" 2>/dev/null | head -3 || echo "    无任何结果"
    fi
    
    print_info "9. 检查 socket 文件"
    ls -la /run/mysqld/ 2>/dev/null || ls -la /var/run/mysqld/ 2>/dev/null || ls -la /tmp/mysql.sock 2>/dev/null || echo "  未找到 socket 文件"
    
    print_info "10. 检查 MariaDB 日志"
    journalctl -u mariadb -n 20 --no-pager 2>/dev/null || \
    journalctl -u mysql -n 20 --no-pager 2>/dev/null || \
    journalctl -u mysqld -n 20 --no-pager 2>/dev/null || \
    echo "  无法获取日志"
    
    print_info "11. 检查端口监听"
    netstat -tulnp 2>/dev/null | grep -i mysql || ss -tulnp 2>/dev/null | grep -i mysql || echo "  未检测到端口监听"
    
    echo ""
    print_warning "=== 常见解决方案 ==="
    echo "  方案 1: 创建 mysql 用户和组"
    echo "    groupadd -r mysql"
    echo "    useradd -r -g mysql -s /bin/false mysql"
    echo "    chown -R mysql:mysql /var/lib/mysql"
    echo ""
    echo "  方案 2: 手动初始化数据库"
    echo "    mysql_install_db --user=mysql --datadir=/var/lib/mysql"
    echo ""
    echo "  方案 3: 重新安装 MariaDB"
    case "$OS_TYPE" in
        debian)
            echo "    apt-get purge -y mariadb-server mariadb-client"
            echo "    apt-get autoremove -y"
            echo "    apt-get install -y mariadb-server mariadb-client"
            ;;
        rhel|fedora)
            echo "    $PACKAGE_MANAGER remove -y mariadb-server mariadb"
            echo "    $PACKAGE_MANAGER install -y mariadb-server mariadb"
            ;;
        arch)
            echo "    pacman -Rs --noconfirm mariadb"
            echo "    pacman -S --noconfirm mariadb"
            echo "    mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql"
            ;;
    esac
    echo ""
    echo "  方案 3: 检查系统资源"
    echo "    df -h  # 检查磁盘空间"
    echo "    free -h  # 检查内存"
    echo ""
    echo "  方案 4: 手动启动服务"
    echo "    systemctl daemon-reload"
    echo "    systemctl start mariadb  # 或 mysql 或 mysqld"
}

#==============================================================================
# 系统检测
#==============================================================================

check_system() {
    print_header "系统环境检测"
    
    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        print_info "操作系统: $PRETTY_NAME"
    else
        print_error "无法识别操作系统"
        exit 1
    fi
    
    # 检测系统类型
    detect_os
    print_success "检测到系统类型: $OS_TYPE (包管理器: $PACKAGE_MANAGER)"
    
    # 检查是否为 root
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 权限运行此脚本"
        print_info "使用命令: sudo bash deploy.sh"
        exit 1
    fi
    
    # 检查网络连接
    print_info "检查网络连接..."
    if ping -c 1 www.baidu.com &> /dev/null || ping -c 1 8.8.8.8 &> /dev/null; then
        print_success "网络连接正常"
    else
        print_error "网络连接失败，请检查网络设置"
        exit 1
    fi
    
    # 更新软件包列表
    print_info "更新软件包列表..."
    case "$OS_TYPE" in
        debian)
            apt-get update -qq || {
                print_error "更新软件包列表失败"
                exit 1
            }
            ;;
        rhel|fedora)
            $PACKAGE_MANAGER makecache -q || {
                print_error "更新软件包列表失败"
                exit 1
            }
            ;;
        arch)
            pacman -Sy --noconfirm || {
                print_error "更新软件包列表失败"
                exit 1
            }
            ;;
        suse)
            zypper refresh || {
                print_error "更新软件包列表失败"
                exit 1
            }
            ;;
    esac
    print_success "软件包列表更新完成"
}

#==============================================================================
# 收集配置信息
#==============================================================================

collect_config() {
    print_header "收集配置信息"
    
    # 域名配置
    echo -e "${BOLD}1. 域名配置${NC}"
    read -p "$(echo -e ${YELLOW}请输入域名（如：example.com，留空则使用服务器IP）: ${NC})" domain
    if [ -z "$domain" ]; then
        # 获取服务器公网IP
        SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "127.0.0.1")
        CONFIG[DOMAIN]=$SERVER_IP
        print_info "将使用 IP 地址: $SERVER_IP"
    else
        CONFIG[DOMAIN]=$domain
    fi
    
    # SSL 配置
    if [ -n "$domain" ]; then
        if confirm "是否申请 SSL 证书（Let's Encrypt）？"; then
            CONFIG[ENABLE_SSL]="yes"
            read -p "$(echo -e ${YELLOW}请输入管理员邮箱（用于 SSL 证书）: ${NC})" email
            CONFIG[SSL_EMAIL]=$email
        else
            CONFIG[ENABLE_SSL]="no"
        fi
    else
        CONFIG[ENABLE_SSL]="no"
        print_warning "使用 IP 地址无法申请 SSL 证书"
    fi
    
    # 端口配置
    echo ""
    echo -e "${BOLD}2. 端口配置${NC}"
    read -p "$(echo -e ${YELLOW}前端端口（默认 80）: ${NC})" frontend_port
    CONFIG[FRONTEND_PORT]=${frontend_port:-80}
    
    read -p "$(echo -e ${YELLOW}后端端口（默认 3000）: ${NC})" backend_port
    CONFIG[BACKEND_PORT]=${backend_port:-3000}
    
    # 数据库配置
    echo ""
    echo -e "${BOLD}3. 数据库配置${NC}"
    read -p "$(echo -e ${YELLOW}数据库名称（默认 expiry_management）: ${NC})" db_name
    CONFIG[DB_NAME]=${db_name:-expiry_management}
    
    read -p "$(echo -e ${YELLOW}数据库用户名（默认 expiry_user）: ${NC})" db_user
    CONFIG[DB_USER]=${db_user:-expiry_user}
    
    read -sp "$(echo -e ${YELLOW}数据库密码（留空则自动生成）: ${NC})" db_pass
    echo ""
    if [ -z "$db_pass" ]; then
        CONFIG[DB_PASSWORD]=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
        print_info "已自动生成数据库密码"
    else
        CONFIG[DB_PASSWORD]=$db_pass
    fi
    
    # JWT Secret
    echo ""
    echo -e "${BOLD}4. 安全配置${NC}"
    CONFIG[JWT_SECRET]=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    print_info "已自动生成 JWT Secret"
    
    # 超级管理员配置
    echo ""
    echo -e "${BOLD}5. 超级管理员账号${NC}"
    read -p "$(echo -e ${YELLOW}用户名: ${NC})" admin_user
    CONFIG[ADMIN_USER]=$admin_user
    
    read -sp "$(echo -e ${YELLOW}密码（至少6位，含字母和数字）: ${NC})" admin_pass
    echo ""
    
    # 验证密码格式
    while true; do
        # 检查长度
        if [ ${#admin_pass} -lt 6 ]; then
            print_error "密码长度至少需要6位"
            read -sp "$(echo -e ${YELLOW}请重新输入密码: ${NC})" admin_pass
            echo ""
            continue
        fi
        
        # 检查是否包含字母
        if ! echo "$admin_pass" | grep -q '[A-Za-z]'; then
            print_error "密码必须包含字母"
            read -sp "$(echo -e ${YELLOW}请重新输入密码: ${NC})" admin_pass
            echo ""
            continue
        fi
        
        # 检查是否包含数字
        if ! echo "$admin_pass" | grep -q '[0-9]'; then
            print_error "密码必须包含数字"
            read -sp "$(echo -e ${YELLOW}请重新输入密码: ${NC})" admin_pass
            echo ""
            continue
        fi
        
        # 所有检查通过
        break
    done
    
    CONFIG[ADMIN_PASSWORD]=$admin_pass
    
    read -p "$(echo -e ${YELLOW}手机号: ${NC})" admin_phone
    CONFIG[ADMIN_PHONE]=$admin_phone
    
    # 确认配置
    echo ""
    print_header "配置信息确认"
    echo -e "${BOLD}域名/IP:${NC} ${CONFIG[DOMAIN]}"
    echo -e "${BOLD}SSL:${NC} ${CONFIG[ENABLE_SSL]}"
    echo -e "${BOLD}前端端口:${NC} ${CONFIG[FRONTEND_PORT]}"
    echo -e "${BOLD}后端端口:${NC} ${CONFIG[BACKEND_PORT]}"
    echo -e "${BOLD}数据库名:${NC} ${CONFIG[DB_NAME]}"
    echo -e "${BOLD}数据库用户:${NC} ${CONFIG[DB_USER]}"
    echo -e "${BOLD}管理员:${NC} ${CONFIG[ADMIN_USER]}"
    echo ""
    
    if ! confirm "配置信息是否正确？"; then
        print_warning "重新配置..."
        collect_config
    fi
}

#==============================================================================
# 安装依赖
#==============================================================================

install_dependencies() {
    print_header "安装系统依赖"
    
    # 安装 Node.js
    print_info "安装 Node.js 和 npm..."
    if ! command -v node &> /dev/null; then
        case "$OS_TYPE" in
            debian)
                curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                apt-get install -y nodejs
                ;;
            rhel|fedora)
                curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
                $PACKAGE_MANAGER install -y nodejs
                ;;
            arch)
                pacman -S --noconfirm nodejs npm
                ;;
            suse)
                zypper install -y nodejs npm
                ;;
        esac
        print_success "Node.js 安装完成"
    else
        print_success "Node.js 已安装: $(node --version)"
    fi
    
    # 安装 Nginx
    print_info "安装 Nginx..."
    if ! command -v nginx &> /dev/null; then
        case "$OS_TYPE" in
            debian)
                apt-get install -y nginx
                ;;
            rhel|fedora)
                $PACKAGE_MANAGER install -y nginx
                ;;
            arch)
                pacman -S --noconfirm nginx
                ;;
            suse)
                zypper install -y nginx
                ;;
        esac
        systemctl enable nginx
        print_success "Nginx 安装完成"
    else
        print_success "Nginx 已安装"
    fi
    
    # 安装 MariaDB/MySQL
    print_info "安装 MariaDB..."
    if ! command -v mysql &> /dev/null; then
        case "$OS_TYPE" in
            debian)
                DEBIAN_FRONTEND=noninteractive apt-get install -y mariadb-server mariadb-client
                ;;
            rhel|fedora)
                $PACKAGE_MANAGER install -y mariadb-server mariadb
                # RHEL 系列需要手动初始化
                if [ ! -d "/var/lib/mysql/mysql" ]; then
                    print_info "初始化 MariaDB 数据库..."
                    mysql_install_db --user=mysql --datadir=/var/lib/mysql 2>/dev/null || \
                    mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql 2>/dev/null || true
                fi
                ;;
            arch)
                pacman -S --noconfirm mariadb
                # Arch 必须手动初始化
                if [ ! -d "/var/lib/mysql/mysql" ]; then
                    print_info "初始化 MariaDB 数据库..."
                    mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
                fi
                ;;
            suse)
                zypper install -y mariadb mariadb-client
                ;;
        esac
        print_success "MariaDB 安装完成"
    else
        print_success "MariaDB 已安装"
    fi
    
    # 确保数据目录存在且权限正确
    if [ ! -d "/var/lib/mysql" ]; then
        print_info "创建 MariaDB 数据目录..."
        mkdir -p /var/lib/mysql
    fi
    
    # 确保 mysql 用户和用户组存在
    if ! id -u mysql &> /dev/null; then
        print_info "创建 mysql 用户..."
        case "$OS_TYPE" in
            debian|suse)
                useradd -r -s /bin/false mysql 2>/dev/null || true
                ;;
            rhel|fedora)
                useradd -r -s /sbin/nologin mysql 2>/dev/null || true
                ;;
            arch)
                useradd -r -s /usr/bin/nologin mysql 2>/dev/null || true
                ;;
        esac
        print_success "mysql 用户创建完成"
    else
        print_success "mysql 用户已存在"
    fi
    
    # 设置数据目录权限
    chown -R mysql:mysql /var/lib/mysql 2>/dev/null || {
        print_warning "无法设置 mysql 用户权限，尝试修复..."
        # 如果 mysql 组不存在，创建它
        if ! getent group mysql &> /dev/null; then
            groupadd -r mysql 2>/dev/null || true
        fi
        # 再次尝试设置权限
        chown -R mysql:mysql /var/lib/mysql
    }
    
    # 确保数据库已初始化
    if [ ! -d "/var/lib/mysql/mysql" ]; then
        print_warning "MariaDB 数据库未初始化，正在初始化..."
        
        # 确保目录权限正确
        chown -R mysql:mysql /var/lib/mysql
        chmod 750 /var/lib/mysql
        
        # 查找可用的初始化命令
        INIT_CMD=""
        
        if command -v mysql_install_db &> /dev/null; then
            INIT_CMD="mysql_install_db"
            print_info "使用 mysql_install_db 初始化..."
        elif command -v mysqld &> /dev/null; then
            INIT_CMD="mysqld"
            print_info "使用 mysqld 初始化..."
        elif [ -f "/usr/bin/mysql_install_db" ]; then
            INIT_CMD="/usr/bin/mysql_install_db"
            print_info "找到 /usr/bin/mysql_install_db"
        elif [ -f "/usr/sbin/mysqld" ]; then
            INIT_CMD="/usr/sbin/mysqld"
            print_info "找到 /usr/sbin/mysqld"
        elif [ -f "/usr/libexec/mysqld" ]; then
            INIT_CMD="/usr/libexec/mysqld"
            print_info "找到 /usr/libexec/mysqld"
        else
            print_error "无法找到数据库初始化命令"
            print_info "正在查找 MariaDB/MySQL 相关命令..."
            find /usr -name "mysql_install_db" -o -name "mysqld" 2>/dev/null | head -5
            
            print_warning "尝试重新安装 MariaDB..."
            case "$OS_TYPE" in
                debian)
                    apt-get install --reinstall -y mariadb-server mariadb-client
                    ;;
                rhel|fedora)
                    $PACKAGE_MANAGER reinstall -y mariadb-server mariadb
                    ;;
                arch)
                    pacman -S --noconfirm mariadb
                    ;;
                suse)
                    zypper install --force -y mariadb mariadb-client
                    ;;
            esac
            
            # 再次查找
            if command -v mysql_install_db &> /dev/null; then
                INIT_CMD="mysql_install_db"
            elif command -v mysqld &> /dev/null; then
                INIT_CMD="mysqld"
            else
                print_error "重新安装后仍然无法找到初始化命令"
                diagnose_mariadb
                exit 1
            fi
        fi
        
        # 执行初始化
        print_info "执行数据库初始化..."
        if [ "$INIT_CMD" = "mysql_install_db" ] || [ "$INIT_CMD" = "/usr/bin/mysql_install_db" ]; then
            $INIT_CMD --user=mysql --datadir=/var/lib/mysql 2>&1 | tee /tmp/mysql_install.log
        else
            $INIT_CMD --initialize-insecure --user=mysql --datadir=/var/lib/mysql 2>&1 | tee /tmp/mysql_install.log
        fi
        
        if [ $? -ne 0 ]; then
            print_error "数据库初始化失败，查看日志："
            cat /tmp/mysql_install.log
            exit 1
        fi
        
        # 验证初始化结果
        if [ -d "/var/lib/mysql/mysql" ]; then
            print_success "MariaDB 数据库初始化完成"
        else
            print_error "数据库初始化后 mysql 数据库目录仍不存在"
            ls -la /var/lib/mysql/
            exit 1
        fi
    fi
    
    # 检测 MariaDB 服务名称
    print_info "检测数据库服务名称..."
    if ! detect_mariadb_service; then
        print_error "无法检测到 MariaDB/MySQL 服务"
        print_warning "尝试重新加载 systemd 配置..."
        systemctl daemon-reload
        sleep 2
        
        # 再次尝试检测
        if ! detect_mariadb_service; then
            print_error "仍然无法检测到服务，尝试重新安装 MariaDB..."
            case "$OS_TYPE" in
                debian)
                    apt-get purge -y mariadb-server mariadb-client
                    apt-get autoremove -y
                    apt-get install -y mariadb-server mariadb-client
                    ;;
                rhel|fedora)
                    $PACKAGE_MANAGER remove -y mariadb-server mariadb
                    $PACKAGE_MANAGER install -y mariadb-server mariadb
                    ;;
                arch)
                    pacman -Rs --noconfirm mariadb
                    pacman -S --noconfirm mariadb
                    mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
                    ;;
            esac
            
            systemctl daemon-reload
            sleep 2
            
            # 第三次尝试
            if ! detect_mariadb_service; then
                diagnose_mariadb
                exit 1
            fi
        fi
    fi
    
    # 启用服务
    systemctl enable $MARIADB_SERVICE 2>/dev/null || true
    
    # 确保 MariaDB 服务启动
    print_info "启动 $MARIADB_SERVICE 服务..."
    systemctl start $MARIADB_SERVICE
    
    # 等待服务完全启动
    print_info "等待 $MARIADB_SERVICE 服务就绪..."
    for i in {1..30}; do
        if mysqladmin ping &> /dev/null; then
            print_success "$MARIADB_SERVICE 服务已就绪"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "$MARIADB_SERVICE 服务启动超时"
            diagnose_mariadb
            exit 1
        fi
        sleep 1
    done
    
    # 安装 PM2
    print_info "安装 PM2..."
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        pm2 startup systemd -u root --hp /root
        print_success "PM2 安装完成"
    else
        print_success "PM2 已安装"
    fi
    
    # 安装 Certbot
    if [ "${CONFIG[ENABLE_SSL]}" = "yes" ]; then
        print_info "安装 Certbot..."
        if ! command -v certbot &> /dev/null; then
            case "$OS_TYPE" in
                debian)
                    apt-get install -y certbot python3-certbot-nginx
                    ;;
                rhel|fedora)
                    $PACKAGE_MANAGER install -y certbot python3-certbot-nginx
                    ;;
                arch)
                    pacman -S --noconfirm certbot certbot-nginx
                    ;;
                suse)
                    zypper install -y certbot python3-certbot-nginx
                    ;;
            esac
            print_success "Certbot 安装完成"
        else
            print_success "Certbot 已安装"
        fi
    fi
    
    # 安装其他必要工具
    print_info "安装其他必要工具..."
    case "$OS_TYPE" in
        debian)
            apt-get install -y curl wget openssl
            ;;
        rhel|fedora)
            $PACKAGE_MANAGER install -y curl wget openssl
            ;;
        arch)
            pacman -S --noconfirm curl wget openssl
            ;;
        suse)
            zypper install -y curl wget openssl
            ;;
    esac
    print_success "必要工具安装完成"
}

#==============================================================================
# 配置数据库
#==============================================================================

setup_database() {
    print_header "配置数据库"
    
    # 再次确认 MariaDB 服务状态
    print_info "检查 $MARIADB_SERVICE 服务状态..."
    if ! systemctl is-active --quiet $MARIADB_SERVICE; then
        print_warning "$MARIADB_SERVICE 服务未运行，正在启动..."
        systemctl start $MARIADB_SERVICE
        sleep 3
        
        # 等待服务就绪
        for i in {1..30}; do
            if mysqladmin ping &> /dev/null; then
                print_success "$MARIADB_SERVICE 服务已启动"
                break
            fi
            if [ $i -eq 30 ]; then
                print_error "$MARIADB_SERVICE 服务启动失败"
                diagnose_mariadb
                exit 1
            fi
            sleep 1
        done
    else
        print_success "$MARIADB_SERVICE 服务运行正常"
    fi
    
    # 创建数据库和用户
    print_info "创建数据库和用户..."
    
    # 尝试连接测试
    if ! mysql -u root -e "SELECT 1" &> /dev/null; then
        print_error "无法连接到 MariaDB，可能需要设置 root 密码"
        print_info "尝试使用 sudo 连接..."
    fi
    
    mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS ${CONFIG[DB_NAME]} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${CONFIG[DB_USER]}'@'localhost' IDENTIFIED BY '${CONFIG[DB_PASSWORD]}';
GRANT ALL PRIVILEGES ON ${CONFIG[DB_NAME]}.* TO '${CONFIG[DB_USER]}'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    if [ $? -eq 0 ]; then
        print_success "数据库配置完成"
    else
        print_error "数据库配置失败"
        exit 1
    fi
}

#==============================================================================
# 配置后端
#==============================================================================

setup_backend() {
    print_header "配置后端服务"
    
    cd $BACKEND_DIR
    
    # 创建 .env 文件
    print_info "创建环境配置文件..."
    cat > .env << EOF
# 数据库配置
DATABASE_URL="mysql://${CONFIG[DB_USER]}:${CONFIG[DB_PASSWORD]}@localhost:3306/${CONFIG[DB_NAME]}"

# 服务器配置
PORT=${CONFIG[BACKEND_PORT]}
NODE_ENV=production

# JWT 配置
JWT_SECRET=${CONFIG[JWT_SECRET]}
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_MAX_SIZE=10485760

# CORS 配置
ALLOWED_ORIGINS=http://${CONFIG[DOMAIN]}:${CONFIG[FRONTEND_PORT]},http://${CONFIG[DOMAIN]}
EOF
    
    if [ "${CONFIG[ENABLE_SSL]}" = "yes" ]; then
        echo "ALLOWED_ORIGINS=https://${CONFIG[DOMAIN]},http://${CONFIG[DOMAIN]}" >> .env
    fi
    
    print_success "环境配置创建完成"
    
    # 检查 package.json 是否存在
    if [ ! -f "package.json" ]; then
        print_error "后端目录下找不到 package.json"
        print_info "当前目录: $(pwd)"
        ls -la
        exit 1
    fi
    
    # 安装依赖
    print_info "安装后端依赖..."
    print_warning "这可能需要几分钟，请耐心等待..."
    
    # 使用国内镜像加速
    npm config set registry https://registry.npmmirror.com
    
    timeout 600 npm install --production --loglevel=info 2>&1 | tee /tmp/backend_install.log &
    NPM_PID=$!
    
    # 显示进度提示
    SECONDS=0
    while kill -0 $NPM_PID 2>/dev/null; do
        ELAPSED=$SECONDS
        printf "\r  已经运行: ${ELAPSED}秒 (最长等待 600秒)..."
        sleep 5
    done
    echo ""
    
    wait $NPM_PID
    NPM_EXIT_CODE=$?
    
    if [ $NPM_EXIT_CODE -eq 124 ]; then
        print_error "后端依赖安装超时"
        print_info "查看安装日志:"
        tail -50 /tmp/backend_install.log
        exit 1
    elif [ $NPM_EXIT_CODE -ne 0 ]; then
        print_error "后端依赖安装失败"
        print_info "查看错误日志:"
        tail -50 /tmp/backend_install.log
        exit 1
    fi
    
    print_success "后端依赖安装完成"
    
    # 恢复 npm 配置
    npm config delete registry
    
    # 运行数据库迁移
    print_info "运行数据库迁移..."
    npx prisma generate
    npx prisma migrate deploy
    print_success "数据库迁移完成"
}

#==============================================================================
# 配置前端
#==============================================================================

setup_frontend() {
    print_header "配置前端"
    
    cd $FRONTEND_DIR
    
    # 创建环境配置
    print_info "创建前端环境配置..."
    
    BACKEND_URL="http://${CONFIG[DOMAIN]}:${CONFIG[BACKEND_PORT]}"
    if [ "${CONFIG[ENABLE_SSL]}" = "yes" ]; then
        BACKEND_URL="https://${CONFIG[DOMAIN]}"
    fi
    
    cat > .env.production << EOF
VITE_API_BASE_URL=${BACKEND_URL}/api
EOF
    
    # 检查 package.json 是否存在
    if [ ! -f "package.json" ]; then
        print_error "前端目录下找不到 package.json"
        print_info "当前目录: $(pwd)"
        ls -la
        exit 1
    fi
    
    # 清理旧的依赖（如果存在）
    if [ -d "node_modules" ]; then
        print_warning "检测到旧的 node_modules，正在清理..."
        rm -rf node_modules package-lock.json
    fi
    
    # 安装依赖
    print_info "安装前端依赖..."
    print_warning "这可能需要几分钟，请耐心等待..."
    
    # 使用国内镜像加速
    print_info "配置 npm 镜像源..."
    npm config set registry https://registry.npmmirror.com
    
    # 分步骤安装，显示进度
    print_info "步骤 1/2: 下载依赖包..."
    
    # 使用更长的超时时间，并显示进度
    timeout 600 npm install --loglevel=info 2>&1 | tee /tmp/frontend_install.log &
    NPM_PID=$!
    
    # 显示进度提示
    SECONDS=0
    while kill -0 $NPM_PID 2>/dev/null; do
        ELAPSED=$SECONDS
        printf "\r  已经运行: ${ELAPSED}秒 (最长等待 600秒)..."
        sleep 5
    done
    echo ""
    
    # 等待进程结束并获取退出状态
    wait $NPM_PID
    NPM_EXIT_CODE=$?
    
    if [ $NPM_EXIT_CODE -eq 124 ]; then
        print_error "依赖安装超时（超过 10 分钟）"
        print_info "查看安装日志:"
        tail -50 /tmp/frontend_install.log
        print_warning "请检查网络连接或尝试手动安装："
        echo "  cd $FRONTEND_DIR"
        echo "  npm install"
        exit 1
    elif [ $NPM_EXIT_CODE -ne 0 ]; then
        print_error "依赖安装失败（退出状态: $NPM_EXIT_CODE）"
        print_info "查看错误日志:"
        tail -50 /tmp/frontend_install.log
        
        print_warning "尝试使用 --legacy-peer-deps 重试..."
        if timeout 600 npm install --legacy-peer-deps; then
            print_success "使用 --legacy-peer-deps 安装成功"
        else
            print_error "重试仍然失败"
            exit 1
        fi
    fi
    
    print_success "前端依赖安装完成"
    
    # 构建前端
    print_info "步骤 2/2: 构建前端项目..."
    print_warning "这可能需要几分钟..."
    
    # 跳过类型检查以加快构建速度（生产环境可选）
    if ! npx vite build 2>&1 | tee /tmp/frontend_build.log; then
        print_error "前端构建失败"
        print_info "查看构建日志:"
        tail -50 /tmp/frontend_build.log
        exit 1
    fi
    
    # 验证构建结果
    if [ ! -d "dist" ]; then
        print_error "构建后 dist 目录不存在"
        ls -la
        exit 1
    fi
    
    print_success "前端构建完成"
    
    # 恢复 npm 镜像配置
    npm config delete registry
}

#==============================================================================
# 配置 Nginx
#==============================================================================

setup_nginx() {
    print_header "配置 Nginx"
    
    # 创建 Nginx 配置文件
    NGINX_CONF="/etc/nginx/sites-available/expiry-management"
    
    print_info "创建 Nginx 配置..."
    
    cat > $NGINX_CONF << EOF
# 后端 API 服务器
upstream backend {
    server 127.0.0.1:${CONFIG[BACKEND_PORT]};
}

server {
    listen ${CONFIG[FRONTEND_PORT]};
    server_name ${CONFIG[DOMAIN]};
    
    # 前端静态文件
    location / {
        root $FRONTEND_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端 API 代理
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 文件上传限制
    client_max_body_size 10M;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
EOF
    
    # 启用配置
    ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    print_info "测试 Nginx 配置..."
    nginx -t || {
        print_error "Nginx 配置错误"
        exit 1
    }
    
    print_success "Nginx 配置完成"
}

#==============================================================================
# 配置 SSL
#==============================================================================

setup_ssl() {
    if [ "${CONFIG[ENABLE_SSL]}" != "yes" ]; then
        return
    fi
    
    print_header "配置 SSL 证书"
    
    print_info "申请 SSL 证书..."
    
    # 暂时停止 Nginx
    systemctl stop nginx
    
    # 申请证书
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email ${CONFIG[SSL_EMAIL]} \
        -d ${CONFIG[DOMAIN]} || {
        print_warning "SSL 证书申请失败，将使用 HTTP"
        CONFIG[ENABLE_SSL]="no"
        systemctl start nginx
        return
    }
    
    # 更新 Nginx 配置
    NGINX_CONF="/etc/nginx/sites-available/expiry-management"
    
    cat > $NGINX_CONF << EOF
# 后端 API 服务器
upstream backend {
    server 127.0.0.1:${CONFIG[BACKEND_PORT]};
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name ${CONFIG[DOMAIN]};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS 服务器
server {
    listen 443 ssl http2;
    server_name ${CONFIG[DOMAIN]};
    
    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/${CONFIG[DOMAIN]}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${CONFIG[DOMAIN]}/privkey.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 前端静态文件
    location / {
        root $FRONTEND_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端 API 代理
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    client_max_body_size 10M;
    
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
EOF
    
    # 设置自动续期
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    
    print_success "SSL 证书配置完成"
}

#==============================================================================
# 启动服务
#==============================================================================

start_services() {
    print_header "启动服务"
    
    # 启动后端服务（使用 PM2）
    print_info "启动后端服务..."
    cd $BACKEND_DIR
    
    # 创建 PM2 配置文件（使用 .cjs 扩展名以兼容 ES Module）
    cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'expiry-backend',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/error.log',
    out_file: 'logs/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
};
EOF
    
    pm2 delete expiry-backend 2>/dev/null || true
    pm2 start ecosystem.config.cjs
    pm2 save
    
    print_success "后端服务启动完成"
    
    # 启动 Nginx
    print_info "启动 Nginx..."
    systemctl restart nginx
    print_success "Nginx 启动完成"
}

#==============================================================================
# 创建超级管理员
#==============================================================================

create_admin() {
    print_header "创建超级管理员账号"
    
    cd $BACKEND_DIR
    
    # 创建管理员脚本（使用 .cjs 扩展名）
    cat > create_admin.cjs << 'EOFJS'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  const username = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE;
  
  try {
    // 检查用户是否已存在
    const existing = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existing) {
      console.log('超级管理员已存在');
      return;
    }
    
    // 创建超级管理员
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        phone,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });
    
    console.log('超级管理员创建成功:', admin.username);
  } catch (error) {
    console.error('创建超级管理员失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
EOFJS
    
    # 运行创建脚本
    ADMIN_USER="${CONFIG[ADMIN_USER]}" \
    ADMIN_PASSWORD="${CONFIG[ADMIN_PASSWORD]}" \
    ADMIN_PHONE="${CONFIG[ADMIN_PHONE]}" \
    node create_admin.cjs
    
    rm -f create_admin.cjs
    
    print_success "超级管理员创建完成"
}

#==============================================================================
# 健康检查
#==============================================================================

health_check() {
    print_header "服务健康检查"
    
    # 检查后端服务
    print_info "检查后端服务..."
    sleep 3
    
    if pm2 list | grep -q "expiry-backend.*online"; then
        print_success "后端服务运行正常"
    else
        print_error "后端服务启动失败"
        pm2 logs expiry-backend --lines 20
        exit 1
    fi
    
    # 检查后端 API
    print_info "检查后端 API..."
    if curl -s http://localhost:${CONFIG[BACKEND_PORT]}/api/health > /dev/null; then
        print_success "后端 API 响应正常"
    else
        print_warning "后端 API 响应异常"
    fi
    
    # 检查 Nginx
    print_info "检查 Nginx..."
    if systemctl is-active --quiet nginx; then
        print_success "Nginx 运行正常"
    else
        print_error "Nginx 启动失败"
        exit 1
    fi
    
    # 检查数据库连接
    print_info "检查数据库连接..."
    if mysql -u ${CONFIG[DB_USER]} -p${CONFIG[DB_PASSWORD]} -e "USE ${CONFIG[DB_NAME]}" 2>/dev/null; then
        print_success "数据库连接正常"
    else
        print_error "数据库连接失败"
        exit 1
    fi
}

#==============================================================================
# 保存配置信息
#==============================================================================

save_config() {
    print_header "保存部署信息"
    
    CONFIG_FILE="$PROJECT_ROOT/deployment-info.txt"
    
    cat > $CONFIG_FILE << EOF
========================================
商品保质期管理系统 - 部署信息
========================================
部署时间: $(date '+%Y-%m-%d %H:%M:%S')

访问信息:
--------
EOF
    
    if [ "${CONFIG[ENABLE_SSL]}" = "yes" ]; then
        echo "前端地址: https://${CONFIG[DOMAIN]}" >> $CONFIG_FILE
        echo "后端地址: https://${CONFIG[DOMAIN]}/api" >> $CONFIG_FILE
    else
        echo "前端地址: http://${CONFIG[DOMAIN]}:${CONFIG[FRONTEND_PORT]}" >> $CONFIG_FILE
        echo "后端地址: http://${CONFIG[DOMAIN]}:${CONFIG[BACKEND_PORT]}" >> $CONFIG_FILE
    fi
    
    cat >> $CONFIG_FILE << EOF

管理员账号:
----------
用户名: ${CONFIG[ADMIN_USER]}
密码: ${CONFIG[ADMIN_PASSWORD]}
手机号: ${CONFIG[ADMIN_PHONE]}

数据库信息:
----------
数据库名: ${CONFIG[DB_NAME]}
用户名: ${CONFIG[DB_USER]}
密码: ${CONFIG[DB_PASSWORD]}

服务管理命令:
------------
查看后端状态: pm2 status
查看后端日志: pm2 logs expiry-backend
重启后端: pm2 restart expiry-backend
重启 Nginx: systemctl restart nginx

数据库备份:
----------
mysqldump -u ${CONFIG[DB_USER]} -p${CONFIG[DB_PASSWORD]} ${CONFIG[DB_NAME]} > backup.sql

SSL 证书续期:
------------
certbot renew
EOF
    
    chmod 600 $CONFIG_FILE
    
    print_success "部署信息已保存到: $CONFIG_FILE"
}

#==============================================================================
# 显示完成信息
#==============================================================================

show_completion() {
    print_header "部署完成！"
    
    cat << EOF
${GREEN}✓ 系统部署成功！${NC}

${BOLD}访问信息:${NC}
EOF
    
    if [ "${CONFIG[ENABLE_SSL]}" = "yes" ]; then
        echo -e "  前端: ${BLUE}https://${CONFIG[DOMAIN]}${NC}"
        echo -e "  后端: ${BLUE}https://${CONFIG[DOMAIN]}/api${NC}"
    else
        echo -e "  前端: ${BLUE}http://${CONFIG[DOMAIN]}:${CONFIG[FRONTEND_PORT]}${NC}"
        echo -e "  后端: ${BLUE}http://${CONFIG[DOMAIN]}:${CONFIG[BACKEND_PORT]}${NC}"
    fi
    
    cat << EOF

${BOLD}管理员账号:${NC}
  用户名: ${CONFIG[ADMIN_USER]}
  密码: ${CONFIG[ADMIN_PASSWORD]}

${BOLD}常用命令:${NC}
  查看服务状态: ${YELLOW}pm2 status${NC}
  查看日志: ${YELLOW}pm2 logs expiry-backend${NC}
  重启服务: ${YELLOW}pm2 restart expiry-backend${NC}

${BOLD}详细信息:${NC}
  请查看: ${BLUE}$PROJECT_ROOT/deployment-info.txt${NC}

EOF
    
    print_warning "请妥善保管数据库密码和管理员密码！"
}

#==============================================================================
# 主流程
#==============================================================================

main() {
    show_welcome
    check_system
    collect_config
    install_dependencies
    setup_database
    setup_backend
    setup_frontend
    setup_nginx
    setup_ssl
    start_services
    create_admin
    health_check
    save_config
    show_completion
}

# 执行主流程
main
