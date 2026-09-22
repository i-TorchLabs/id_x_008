# -*- coding: utf-8 -*-
"""数据库客户端：从（加密的）环境变量加载凭据，构建异步引擎与会话工厂。

环境变量：
    DB_HOST / DB_PORT / DB_NAME / DB_USERNAME / DB_PASSWORD
凭据允许为密文（encrypt_util 加密），设置 IAO_DB_ENCRYPTED=true 时自动解密。
"""
from __future__ import annotations

import os
from urllib.parse import quote_plus

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

try:
    from .decrypt_util import decrypt
    from .log_util import logger
except ImportError:  # 脚本直跑时的回退
    from decrypt_util import decrypt  # type: ignore
    from log_util import logger  # type: ignore

POOL_DEFAULTS: dict = {
    "pool_size": 32,
    "pool_recycle": 360,
    "pool_pre_ping": True,
}

_engine: AsyncEngine | None = None
_session_maker: async_sessionmaker[AsyncSession] | None = None


def _credential(value: str) -> str:
    if os.environ.get("IAO_DB_ENCRYPTED", "").lower() == "true":
        return decrypt(value)
    return value


def build_dsn() -> str:
    host = _credential(os.environ.get("DB_HOST", "127.0.0.1"))
    port = _credential(os.environ.get("DB_PORT", "5432"))
    name = _credential(os.environ.get("DB_NAME", "postgres"))
    user = quote_plus(_credential(os.environ.get("DB_USERNAME", "postgres")))
    password = quote_plus(_credential(os.environ.get("DB_PASSWORD", "")))
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(build_dsn(), **POOL_DEFAULTS)
        logger.info("数据库引擎已创建（pool_size=32, pool_recycle=360, pool_pre_ping）")
    return _engine


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    global _session_maker
    if _session_maker is None:
        _session_maker = async_sessionmaker(get_engine(), class_=AsyncSession, expire_on_commit=False)
    return _session_maker
