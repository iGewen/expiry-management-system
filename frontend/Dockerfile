# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段 - 使用 nginx 提供静态文件
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
