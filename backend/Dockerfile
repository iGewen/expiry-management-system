FROM node:18-alpine

WORKDIR /app

# 安装必要的系统依赖（Prisma需要）
RUN apk add --no-cache openssl libc6-compat

# 安装依赖
COPY package*.json ./
RUN npm install --omit=dev

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 3000

# 启动命令
ENTRYPOINT ["/docker-entrypoint.sh"]
