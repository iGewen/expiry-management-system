ARG NODE_IMAGE=registry.cn-hangzhou.aliyuncs.com/ihee_docker_project/node:18-alpine
FROM ${NODE_IMAGE}

WORKDIR /app

# 安装必要的系统依赖（Prisma需要）- 兼容 Alpine/Debian/Ubuntu
RUN if command -v apk >/dev/null 2>&1; then \
      apk add --no-cache openssl libc6-compat; \
    elif command -v apt-get >/dev/null 2>&1; then \
      sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list && \
      apt-get update && apt-get install -y openssl libc6 && rm -rf /var/lib/apt/lists/*; \
    elif command -v yum >/dev/null 2>&1; then \
      yum install -y openssl glibc && yum clean all; \
    fi

# 安装依赖
COPY package*.json ./
RUN npm install --omit=dev

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "src/app.js"]
