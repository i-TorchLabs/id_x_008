# -*- coding: utf-8 -*-
"""RSA 加密工具（cryptography 库）：用于前后端敏感信息加密传输。

算法：2048-bit RSA-OAEP SHA-256

密钥生命周期：进程启动时生成，重启后更换。
前端每次加载登录页都会重新获取公钥，不受密钥更换影响。
"""
from __future__ import annotations

import base64

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

# 模块级全局密钥对（惰性生成，进程生命周期内不变）
_private_key: rsa.RSAPrivateKey | None = None
_public_pem: str | None = None


def _ensure_keys() -> None:
    global _private_key, _public_pem
    if _private_key is None:
        _private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        _public_pem = (
            _private_key
            .public_key()
            .public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )
            .decode()
        )


def get_public_key() -> str:
    """返回 RSA 公钥（PEM / SPKI 格式），供前端加密密码使用。"""
    _ensure_keys()
    return _public_pem


def decrypt_password(encrypted_b64: str) -> str:
    """用进程私钥解密前端发来的 Base64 密文，返回明文密码。

    Raises:
        ValueError: 密文格式错误或解密失败。
    """
    _ensure_keys()
    ciphertext = base64.b64decode(encrypted_b64)
    plaintext = _private_key.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return plaintext.decode("utf-8")