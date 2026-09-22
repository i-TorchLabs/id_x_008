"use client";

/** SSO 回调页：接收 ADFS 回跳 token，调用 user_oauth 建档登录。 */
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { userOauth } from "@/api/user";
import { useUser } from "@/stores/userStore";

function OauthInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { setUser } = useUser();
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const token = params.get("token") ?? params.get("code") ?? "";
    if (!token) {
      setError("Missing SSO Token");
      return;
    }
    userOauth(token).then((res) => {
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
