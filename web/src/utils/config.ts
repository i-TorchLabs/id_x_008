/** ADFS OAuth2 端点 */
export const ADFS_BASE_URL = "https://sts.cuhk.edu.cn/adfs/oauth2";
export const ADFS_AUTHORIZE_URL = `${ADFS_BASE_URL}/authorize`;

/**
 * ADFS OAuth2 授权码授予流配置（前端公开部分）
 * - client_id 为公开标识（会出现在浏览器跳转 URL 中），需与 ADFS 应用组注册一致；
 * - client_secret 仅服务端持有，严禁写入前端代码 / 环境变量；
 * - redirect_uri 必须与 ADFS 注册地址完全一致（https，区分大小写）；
 * - NEXT_PUBLIC_* 环境变量用于覆盖默认值（构建期内联）。
 */
export const ADFS_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADFS_CLIENT_ID ??
  "CHANGE_ME_ADFS_CLIENT_ID";
export const ADFS_REDIRECT_URI =
  process.env.NEXT_PUBLIC_ADFS_REDIRECT_URI ??
  "https://sme-iao.cuhk.edu.cn/f/008/user/oauth2";
export const ADFS_RESOURCE =
  process.env.NEXT_PUBLIC_ADFS_RESOURCE ?? "https://sme-iao.cuhk.edu.cn";