# id_x_008 前端镜像（构建上下文为 x_models/id_x_008/web）
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY --from=builder /app ./
# /b/* 服务端重写到后端；Pod 模式与 service 共享网络命名空间
ENV BACKEND_URL=http://127.0.0.1:8101
EXPOSE 2008
CMD ["npm", "start"]
