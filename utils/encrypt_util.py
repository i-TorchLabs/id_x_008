# -*- coding: utf-8 -*-
"""加密工具：XOR + base64，与 decrypt_util 配对使用（用于数据库凭据等敏感配置）。

⚠️ 安全警告：XOR 循环密钥加密在密码学上是极弱的，仅提供混淆级别保护。
   若密钥 IAO_SECRET_KEY 泄露，所有密文可被轻易解密。
   生产环境建议：
   1. 优先使用 K8s Secrets / Podman Secrets 直接注入凭据（绕过应用层加解密）
   2. 若必须应用层加密，请替换为 AES-256-GCM（如 cryptography 库的 Fernet）
   3. 确保 IAO_SECRET_KEY 通过安全的密钥管理服务注入（如 HashiCorp Vault）
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


def encrypt(plain_text: str) -> str:
    _require_key()
    if plain_text is None:
        raise ValueError("The plain string can't be empty.")
    p_bytes = plain_text.encode("utf-8")
    k_bytes = _SECRET_KEY.encode("utf-8")
    encrypted = bytearray()
    for i in range(len(p_bytes)):
        encrypted.append(p_bytes[i] ^ k_bytes[i % len(k_bytes)])
    return base64.b64encode(bytes(encrypted)).decode("utf-8")
