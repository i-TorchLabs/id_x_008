# -*- coding: utf-8 -*-
"""日志工具：提供全局 logger 与请求 ID 上下文。

输出双通道：
1. stdout（容器日志，podman logs 可见）；
2. 文件 ${PROJECT_PATH}/logs/id_x_008.log（10MB × 5 轮转），
   容器内 PROJECT_PATH=/app/i-Core，宿主机经 ops 挂载 ../logs 持久化。
"""
from __future__ import annotations

import logging
import os
import sys
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler
from pathlib import Path

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    rid = request_id_var.get()
    return f"[{rid}] " if rid else ""


def _log_dir() -> Path:
    base = Path(os.environ.get("PROJECT_PATH", Path(__file__).resolve().parents[2]))
    d = base / "logs"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _build_logger() -> logging.Logger:
    logger = logging.getLogger("id_x_008")
    if not logger.handlers:
        fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

        stream = logging.StreamHandler(sys.stdout)
        stream.setFormatter(fmt)
        logger.addHandler(stream)

        try:
            file = RotatingFileHandler(
                _log_dir() / "id_x_008.log",
                maxBytes=10 * 1024 * 1024,
                backupCount=5,
                encoding="utf-8",
            )
            file.setFormatter(fmt)
            logger.addHandler(file)
        except OSError:
            # 日志目录不可写时退化为仅 stdout
            pass
    logger.setLevel(logging.INFO)
    return logger


logger = _build_logger()
