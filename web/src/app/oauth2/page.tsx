"use client";

/** SSO 回调页：ADFS /authorize 重定向后携带 code+state，校验 CSRF 后调用 user_oauth 建档登录。
 *
 *  此页刻意放在顶层路由（非 /user 布局下），因为 SSO 回调时本地尚无会话，
 *  /user/layout.tsx 的 AuthGuard 会在登录完成前把回调弹回 /login。
 *
 *  ADFS 注册的回调地址（认证信息回传地址）为 /f/008/user/oauth2，
 *  由 next.config.ts 的 rewrite（/user/oauth2 → /oauth2）落到本页；
 *  直接访问 /f/008/user/oauth2 同样命中本页（root layout，均无鉴权守卫）。
 *  前端 ADFS_REDIRECT_URI 与后端 IAO_OAUTH_REDIRECT_URI 均须为注册值。 */
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { userOauth } from "@/api/user";
import { useUser } from "@/stores/userStore";
import { OAUTH_STATE_KEY } from "@/utils/sso";

function OauthInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { setUser } = useUser();
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const code = params.get("code");
    const state = params.get("state");

    if (!code) {
      setError("Missing OAuth authorization code");
      return;
    }

    // CSRF 校验：state 必须与授权请求时生成并暂存于 sessionStorage 的一致
    const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    if (!savedState || savedState !== state) {
      setError("Invalid OAuth response: state mismatch (CSRF check failed)");
      return;
    }
    sessionStorage.removeItem(OAUTH_STATE_KEY);

    userOauth(code, state ?? "").then((res) => {
      if (ignore) return;
      if (res.code === 200 && res.parsed) {
        const d = res.parsed as { user_id: number; name: string; token: string };
        setUser({ user_id: d.user_id, name: d.name, role: "user", token: d.token });
        router.replace("/user/home");
      } else {
        setError(res.message || "SSO login failed");
      }
    });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-10 text-center text-gray-500">
      {error ? <span className="text-red-600">{error}</span> : "Signing in via SSO..."}
    </div>
  );
}

export default function OauthPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <OauthInner />
    </Suspense>
  );
}
