import {
  ADFS_AUTHORIZE_URL,
  ADFS_CLIENT_ID,
  ADFS_LOGOUT_URL,
  ADFS_REDIRECT_URI,
  ADFS_RESOURCE,
} from "./config";

/** sessionStorage 中暂存 CSRF state 的 key，回调页据此校验 */
export const OAUTH_STATE_KEY = "iao_adfs_oauth_state";

/** ADFS 是否已配置（仅当非占位默认值时才发起真实 SSO） */
export const isAdfsConfigured =
  Boolean(ADFS_CLIENT_ID) && ADFS_CLIENT_ID !== "CHANGE_ME_ADFS_CLIENT_ID";

/** 生成 CSRF 防护随机串 */
const genState = (): string => {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * 跳转到 ADFS 授权页（授权码授予流）。
 * - 生成并暂存 state（sessionStorage），回调页校验防 CSRF；
 * - response_type=code，redirect_uri 必须与 ADFS 注册地址完全一致。
 */
export const redirectToAdfsAuthorize = (): void => {
  if (!ADFS_CLIENT_ID || ADFS_CLIENT_ID === "CHANGE_ME_ADFS_CLIENT_ID") {
    console.error("ADFS_CLIENT_ID 未配置，无法发起 SSO。请在构建时设置 NEXT_PUBLIC_ADFS_CLIENT_ID");
    return;
  }
  const state = genState();
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: ADFS_CLIENT_ID,
    response_type: "code",
    redirect_uri: ADFS_REDIRECT_URI,
    resource: ADFS_RESOURCE,
    state,
  });
  window.location.href = `${ADFS_AUTHORIZE_URL}?${params.toString()}`;
};

/**
 * 学生登出：整页跳转 ADFS 登出端点，清掉浏览器中的 ADFS SSO 会话。
 *
 * 必须整页跳转而非 XHR/iframe：
 * - XHR 跨域受 CORS 阻拦，请求到不了 ADFS；
 * - iframe 属于第三方上下文，现代浏览器不携带 ADFS 会话 cookie；
 * 只有顶层导航会携带 ADFS cookie 并真正清掉 SSO 会话，
 * 否则下次点 SSO 会被无感放行、无法更换账号。
 */
export const redirectToAdfsLogout = (): void => {
  window.location.href = ADFS_LOGOUT_URL;
};