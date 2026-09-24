# -*- coding: utf-8 -*-
"""解密工具：XOR + base64，与 encrypt_util 配对使用。

⚠️ 安全警告：XOR 加密仅提供混淆级别保护，不建议用于生产环境敏感凭据。
   详见 encrypt_util.py 中的安全建议。
"""
from __future__ import annotations

import base64
import os

_SECRET_KEY = os.environ.get("IAO_SECRET_KEY", "")


def _require_key() -> None:
    """延迟校验密钥：仅在加解密函数实际调用时检查，避免模块导入时就炸。"""
    if not _SECRET_KEY:
        raise RuntimeError(
            "IAO_SECRET_KEY 环境变量未设置。"
            "请设置环境变量 IAO_SECRET_KEY=<your-key> 后再启动服务。（安全策略）"
        )


def decrypt(encrypted_b64: str) -> str:
    _require_key()
    if encrypted_b64 is None:
        raise ValueError("The encryption string can't be empty.")
    encrypted_b64 = encrypted_b64.strip()
    padded = encrypted_b64 + "=" * (-len(encrypted_b64) % 4)
    encrypted = base64.b64decode(padded.encode("utf-8"))
    k_bytes = _SECRET_KEY.encode("utf-8")
    decrypted = bytearray()
    for i in range(len(encrypted)):
        decrypted.append(encrypted[i] ^ k_bytes[i % len(k_bytes)])
    return decrypted.decode("utf-8")
