# -*- coding: utf-8 -*-
"""插件入口：注册 GraphQL 路由 /b/id_x_008/graphql（及 /health）。

两种用法：
1. 作为 i-Core 引擎插件：引擎调用 load_plugin() 获取插件实例，
   注入会话工厂并建表；路由经 register_routers("/b/id_x_008") 挂载。
2. 独立运行：python x_plugin.py，自行创建数据库引擎并启动 Litestar。
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

# 支持独立运行：将仓库根目录加入 sys.path 以便按包导入
_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession, async_sessionmaker  # noqa: E402

try:  # 引擎环境：实现插件协议
    from x_models._contracts import PluginInterface
except Exception:  # 独立运行时的类型占位
    PluginInterface = Any  # type: ignore


ROUTE_PREFIX = "/b/id_x_008"


class _Idx008Plugin:
    """插件实现，懒加载内部模块。"""

    name = "id_x_008"

    def __init__(self) -> None:
        self._base: Any = None

    @property
    def base(self) -> Any:
        if self._base is None:
            from x_models.id_x_008.src.models.x_models import Base
            self._base = Base
        return self._base

    @property
    def required_extensions(self) -> tuple[str, ...]:
        return ()

    def set_session_maker(self, maker: async_sessionmaker[AsyncSession]) -> None:
        from x_models.id_x_008.src.models.x_models import set_session_maker
        set_session_maker(maker)

    async def build_tables(self, conn: AsyncConnection) -> None:
        await conn.run_sync(self.base.metadata.create_all)


def load_plugin() -> PluginInterface:
    return _Idx008Plugin()


def create_app() -> Any:
    """构建 Litestar 应用（独立运行 / 单元测试用）。"""
    from litestar import Litestar, get

    from x_models.id_x_008.src.controllers.x_controllers import register_routers
    from x_models.id_x_008.src.models.x_models import Base, set_session_maker
    from x_models.id_x_008.utils.database_client import get_engine, get_session_maker

    @get(f"{ROUTE_PREFIX}/health")
    async def health() -> dict:
        return {"status": "ok", "service": "id_x_008"}

    async def on_startup() -> None:
        set_session_maker(get_session_maker())
        async with get_engine().begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    return Litestar(
        route_handlers=[health, register_routers(ROUTE_PREFIX)],
        on_startup=[on_startup],
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("IAO_PORT", "8101"))
    uvicorn.run(create_app(), host="0.0.0.0", port=port)
