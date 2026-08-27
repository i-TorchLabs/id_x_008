# -*- coding: utf-8 -*-
"""加密工具：XOR + base64，与 decrypt_util 配对使用（用于数据库凭据等敏感配置）。"""
from __future__ import annotations

import base64
import os

_SECRET_KEY = os.environ.get("AA_SECRET_KEY", "id_x_008_secret_key")


def encrypt(plain_text: str) -> str:
    if plain_text is None:
        raise ValueError("The plain string can't be empty.")
    p_bytes = plain_text.encode("utf-8")
    k_bytes = _SECRET_KEY.encode("utf-8")
    encrypted = bytearray()
    for i in range(len(p_bytes)):
        encrypted.append(p_bytes[i] ^ k_bytes[i % len(k_bytes)])
    return base64.b64encode(bytes(encrypted)).decode("utf-8")
