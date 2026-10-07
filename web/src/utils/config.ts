/** ADFS OAuth2 端点 */
export const ADFS_BASE_URL = "https://sts.cuhk.edu.cn/adfs/oauth2";
export const ADFS_AUTHORIZE_URL = `${ADFS_BASE_URL}/authorize`;
export const ADFS_LOGOUT_URL = `${ADFS_BASE_URL}/logout`;

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
/** SSO 回调地址：basePath=/f/008 下的顶层路由，见 app/oauth2/page.tsx。
 *  注意：必须与 ADFS 应用组注册的 redirect_uri（认证信息回传地址）完全一致（https，区分大小写）。
 *  注册值为 https://sme-iao.cuhk.edu.cn/f/008/user/oauth2，由 next.config.ts 的
 *  rewrite（/user/oauth2 → /oauth2）落到顶层回调页（避开 /user 布局的 AuthGuard）。
 *  此值须与后端 IAO_OAUTH_REDIRECT_URI 保持一致。 */
export const ADFS_REDIRECT_URI =
  process.env.NEXT_PUBLIC_ADFS_REDIRECT_URI ??
  "https://sme-iao.cuhk.edu.cn/f/008/user/oauth2";
export const ADFS_RESOURCE =
  process.env.NEXT_PUBLIC_ADFS_RESOURCE ?? "https://sme-iao.cuhk.edu.cn";