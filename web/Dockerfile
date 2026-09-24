# id_x_008 前端镜像（构建上下文为 x_models/id_x_008/web）
# 构建时可通过 --build-arg 注入 NEXT_PUBLIC_* 变量：
#   podman build --build-arg NEXT_PUBLIC_ADFS_CLIENT_ID=xxx -t id_x_008_web .
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY package.json package-lock.json ./
RUN npm ci

# ADFS OAuth2 公开配置（构建期内联，不含 client_secret）
ARG NEXT_PUBLIC_ADFS_CLIENT_ID
ARG NEXT_PUBLIC_ADFS_REDIRECT_URI
ARG NEXT_PUBLIC_ADFS_RESOURCE
ENV NEXT_PUBLIC_ADFS_CLIENT_ID=${NEXT_PUBLIC_ADFS_CLIENT_ID}
ENV NEXT_PUBLIC_ADFS_REDIRECT_URI=${NEXT_PUBLIC_ADFS_REDIRECT_URI}
ENV NEXT_PUBLIC_ADFS_RESOURCE=${NEXT_PUBLIC_ADFS_RESOURCE}

COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com \
    && addgroup -g 10001 appgroup \
    && adduser -u 10001 -G appgroup -D appuser
COPY --from=builder /app ./
RUN chown -R appuser:appgroup /app
# /b/* 服务端重写到后端；Pod 模式与 service 共享网络命名空间
ENV BACKEND_URL=http://127.0.0.1:8101
USER appuser
EXPOSE 2008
CMD ["npm", "start"]
