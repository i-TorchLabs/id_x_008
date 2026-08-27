"use client";

/** 登录页：管理员账号密码登录 + 学生 SSO 入口。 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/api/admin";
import { userOauth } from "@/api/user";
import { useUser } from "@/stores/userStore";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { setUser } = useUser();
  const router = useRouter();

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await login(username, password);
      if (res.code === 200 && res.parsed) {
        setUser({
          user_id: res.parsed.user_id,
          name: username,
          role: "admin",
          token: res.parsed.token,
        });
        router.replace("/admin/project-management");
      } else {
        setError(res.message || "登录失败");
      }
    } finally {
      setBusy(false);
    }
  };

  // 学生 SSO：生产环境应跳转 CUHK ADFS；此处演示以 base64(JSON) 模拟回调
  const doSso = async () => {
    const token = btoa(JSON.stringify({
      number: "1234567890",
      name: "Demo Student",
      email: "1234567890@link.cuhk.edu.cn",
      grade: "UG Year 1",
    }));
    const res = await userOauth(token);
    if (res.code === 200 && res.parsed) {
      const d = res.parsed as { user_id: number; name: string; token: string };
      setUser({ user_id: d.user_id, name: d.name, role: "user", token: d.token });
      router.replace("/user/home");
    } else {
      setError(res.message || "SSO 登录失败");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-xl font-semibold text-[#7a0026]">
          SME IAO 1v1 咨询预约系统
        </h1>
        <form onSubmit={doLogin} className="space-y-4">
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="管理员账号"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-[#7a0026] py-2 text-white disabled:opacity-50"
          >
            {busy ? "登录中..." : "管理员登录"}
          </button>
        </form>
        <div className="my-4 border-t" />
        <button
          onClick={doSso}
          className="w-full rounded border border-[#7a0026] py-2 text-[#7a0026] hover:bg-[#7a0026]/5"
        >
          学生 CUHK SSO 登录
        </button>
      </div>
    </div>
  );
}
