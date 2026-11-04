#!/usr/bin/env bash
# id_x_008 一键启动（幂等，已存在则跳过）
set -euo pipefail

PLUGIN="id_x_008"
HOST_PORT=8008
OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${OPS_DIR}/../../.." && pwd)"

# 1. .env 检查
if [ ! -f "${OPS_DIR}/.env" ]; then
    cp "${OPS_DIR}/.env.example" "${OPS_DIR}/.env"
    echo "已生成 ${OPS_DIR}/.env，请修改后重新执行本脚本"
    exit 0
fi
set -a; source "${OPS_DIR}/.env"; set +a

# 2. 构建镜像
if [ "${1:-}" = "--build" ] || ! podman image exists "${PLUGIN}_service"; then
    podman build --format docker --network=host -t "${PLUGIN}_service" -f "${OPS_DIR}/Dockerfile.service" "${REPO_ROOT}"
fi
if [ "${1:-}" = "--build" ] || ! podman image exists "${PLUGIN}_web"; then
    # 前端 ADFS SSO 公开配置在构建期内联为 NEXT_PUBLIC_*（不含 client_secret）。
    # 默认值与 .env.example 对齐：未显式配置时仍可发起真实 SSO，而非卡在占位默认值。
    podman build --format docker --network=host \
        --build-arg NEXT_PUBLIC_ADFS_CLIENT_ID="${NEXT_PUBLIC_ADFS_CLIENT_ID:-d5b6ea03-977a-4885-b081-4d67e257455b}" \
        --build-arg NEXT_PUBLIC_ADFS_REDIRECT_URI="${NEXT_PUBLIC_ADFS_REDIRECT_URI:-https://sme-iao.cuhk.edu.cn/f/008/user/oauth2}" \
        --build-arg NEXT_PUBLIC_ADFS_RESOURCE="${NEXT_PUBLIC_ADFS_RESOURCE:-https://sme-iao.cuhk.edu.cn}" \
        -t "${PLUGIN}_web" "${OPS_DIR}/../web"
fi

# 3. Pod（已存在则跳过）
if ! podman pod exists "${PLUGIN}"; then
    # 仅暴露 HAProxy 入口（8008），数据库端口不映射到宿主机（安全策略）
    podman pod create --name "${PLUGIN}" \
        -p "${HOST_PORT}:8080"
fi

# 4. 数据卷（已存在则跳过）
podman volume exists "${PLUGIN}_db_data" || podman volume create "${PLUGIN}_db_data"

# 5. 逐容器启动（已存在则跳过）
if ! podman container exists "${PLUGIN}_db"; then
    podman run -d --pod "${PLUGIN}" --name "${PLUGIN}_db" \
        -e POSTGRES_DB="${POSTGRES_DB}" \
        -e POSTGRES_USER="${POSTGRES_USER}" \
        -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
        --expose 5432 \
        -v "${PLUGIN}_db_data:/var/lib/postgresql" \
        -v "${OPS_DIR}/init:/docker-entrypoint-initdb.d:ro" \
        --health-cmd "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}" \
        --health-interval 5s --health-retries 10 \
        docker.io/library/postgres:18
fi

echo "等待 db 就绪..."
until [ "$(podman inspect --format '{{.State.Health.Status}}' "${PLUGIN}_db" 2>/dev/null)" = "healthy" ]; do
    sleep 2
done

if ! podman container exists "${PLUGIN}_service"; then
    # 日志挂载:宿主机 x_models/id_x_008/logs -> 容器 /app/i-Core/logs
    # （先建目录；若本地直接跑 up.sh 而非 compose，需保证目录可写）
    mkdir -p "${OPS_DIR}/../logs"
    # 容器以非特权 appuser 运行，宿主机挂载目录需可写，否则文件日志会退化/丢失
    chmod 777 "${OPS_DIR}/../logs"
    podman run -d --pod "${PLUGIN}" --name "${PLUGIN}_service" \
        -v "${OPS_DIR}/../logs:/app/i-Core/logs" \
        -e DB_NAME="${POSTGRES_DB}" \
        -e DB_HOST=127.0.0.1 \
        -e DB_PORT=5432 \
        -e DB_USERNAME="${POSTGRES_USER}" \
        -e DB_PASSWORD="${POSTGRES_PASSWORD}" \
        -e IAO_DB_ENCRYPTED="${IAO_DB_ENCRYPTED:-}" \
        -e IAO_SECRET_KEY="${IAO_SECRET_KEY:-}" \
        -e IAO_ENV="${IAO_ENV:-production}" \
        -e IAO_MAIL_PASSWORD="${IAO_MAIL_PASSWORD:-}" \
        -e IAO_MAIL_USER="${IAO_MAIL_USER:-}" \
        -e IAO_MAIL_FROM="${IAO_MAIL_FROM:-}" \
        -e IAO_OAUTH_CLIENT_ID="${IAO_OAUTH_CLIENT_ID:-}" \
        -e IAO_OAUTH_CLIENT_SECRET="${IAO_OAUTH_CLIENT_SECRET:-}" \
        -e IAO_OAUTH_REDIRECT_URI="${IAO_OAUTH_REDIRECT_URI:-}" \
        -e IAO_OAUTH_BUSINESS_URL="${IAO_OAUTH_BUSINESS_URL:-}" \
        -e IAO_OAUTH_ADFS_BASE="${IAO_OAUTH_ADFS_BASE:-}" \
        -e IAO_OAUTH_ADFS_DISCOVERY_URL="${IAO_OAUTH_ADFS_DISCOVERY_URL:-}" \
        -e IAO_OAUTH_ADFS_JWKS_URL="${IAO_OAUTH_ADFS_JWKS_URL:-}" \
        -e IAO_OAUTH_UPN_CLAIM="${IAO_OAUTH_UPN_CLAIM:-}" \
        -e IAO_OAUTH_EMAIL_CLAIM="${IAO_OAUTH_EMAIL_CLAIM:-}" \
        -e IAO_OAUTH_CLOCK_SKEW_SECONDS="${IAO_OAUTH_CLOCK_SKEW_SECONDS:-}" \
        -e IAO_OAUTH_NONCE="${IAO_OAUTH_NONCE:-}" \
        -e IAO_PORT=8101 \
        -e PROJECT_PATH=/app/i-Core \
        "${PLUGIN}_service"
fi

if ! podman container exists "${PLUGIN}_web"; then
    podman run -d --pod "${PLUGIN}" --name "${PLUGIN}_web" \
        -e BACKEND_URL=http://127.0.0.1:8101 \
        "${PLUGIN}_web"
fi

if ! podman container exists "${PLUGIN}_haproxy"; then
    podman run -d --pod "${PLUGIN}" --name "${PLUGIN}_haproxy" \
        -e SERVICE_HOST=127.0.0.1 \
        -e WEB_HOST=127.0.0.1 \
        -v "${OPS_DIR}/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro" \
        docker.io/library/haproxy:3.0
fi

echo "启动完成: http://localhost:${HOST_PORT}"
