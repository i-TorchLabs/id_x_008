-- id_x_008 初始化：预置管理员账号（首启建库时执行）
-- 密码以 PBKDF2-SHA256 格式存储（与 src/views/x_views.py 的 _hash_password 一致）
--
-- ⚠️ 安全策略：此文件使用占位哈希（无法登录），生产部署前必须手动替换为真实密码哈希。
--    生产环境密码生成方式：
--      python -c "from x_models.id_x_008.src.views import x_views; print(x_views._hash_password('YOUR_SECURE_PASSWORD'))"
--    然后替换下面 INSERT 语句中的 password 字段值。
--    部署完成后立即登录后台修改密码。

-- 若表先于服务启动创建（服务 on_startup 为 create_all，幂等兼容）
CREATE TABLE IF NOT EXISTS iao_enlist_user (
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
COMMENT ON TABLE iao_enlist_user IS '用户表';

-- 幂等插入管理员（username 唯一判定，重复执行不报错）
-- 占位哈希无法用于登录；生产部署前必须替换为真实密码哈希。
INSERT INTO iao_enlist_user (username, password, role, name, email)
SELECT 'rayzha@cuhk.edu.cn',
       '$pbkdf2_sha256$600000$obEnbUnMOIZp2kXEs7W1FYt6vQJTrxsbgoSLgNfr3s8=$T3SQaqAG7xRmVOdnUloUj5S5kSbo1TmoqAdxySA1Hxc=',
       'admin',
       'Admin',
       'rayzha@cuhk.edu.cn'
WHERE NOT EXISTS (
    SELECT 1 FROM iao_enlist_user WHERE username = 'rayzha@cuhk.edu.cn'
);
