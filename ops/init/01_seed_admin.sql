-- id_x_008 初始化：预置管理员账号（首启建库时执行）
-- 密码以 SHA-256 十六进制存储（与 src/views/x_views.py 的 _hash_password 一致）
-- 明文：P@ss2026!  →  sha256: 0d81614a64bda9083d0a3b38b2d102fd9953f1628d3ab5edbd0cdd73f87d565b

-- 若表先于服务启动创建（服务 on_startup 为 create_all，幂等兼容）
CREATE TABLE IF NOT EXISTS aa_enlist_user (
    id       SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL DEFAULT 'N/A',
    password VARCHAR(255) NOT NULL DEFAULT 'N/A',
    role     VARCHAR(255) NOT NULL DEFAULT 'user',
    "key"    TEXT         NOT NULL DEFAULT 'N/A',
    name     VARCHAR(255) NOT NULL DEFAULT 'N/A',
    grade    VARCHAR(255) NOT NULL DEFAULT 'N/A',
    number   VARCHAR(255) NOT NULL DEFAULT 'N/A',
    email    VARCHAR(255) NOT NULL DEFAULT 'N/A',
    time     TIMESTAMP    NULL DEFAULT NOW()
);
COMMENT ON TABLE aa_enlist_user IS '用户表';

-- 幂等插入管理员（username 唯一判定，重复执行不报错）
INSERT INTO aa_enlist_user (username, password, role, name, email)
SELECT 'rayzha@cuhk.edu.cn',
       '0d81614a64bda9083d0a3b38b2d102fd9953f1628d3ab5edbd0cdd73f87d565b',
       'admin',
       '查锐',
       'rayzha@cuhk.edu.cn'
WHERE NOT EXISTS (
    SELECT 1 FROM aa_enlist_user WHERE username = 'rayzha@cuhk.edu.cn'
);
