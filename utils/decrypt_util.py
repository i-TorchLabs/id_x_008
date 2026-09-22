# -*- coding: utf-8 -*-
"""解密工具：XOR + base64，与 encrypt_util 配对使用。"""
from __future__ import annotations

import base64
import os

_SECRET_KEY = os.environ.get("IAO_SECRET_KEY", "id_x_008_secret_key")


def decrypt(encrypted_b64: str) -> str:
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
