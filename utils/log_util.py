# -*- coding: utf-8 -*-
"""日志工具：提供全局 logger 与请求 ID 上下文。"""
from __future__ import annotations

import logging
import sys
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    rid = request_id_var.get()
    return f"[{rid}] " if rid else ""


def _build_logger() -> logging.Logger:
    logger = logging.getLogger("id_x_008")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        ))
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


logger = _build_logger()
