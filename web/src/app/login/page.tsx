"use client";

/** 登录页：复刻 id_x_204 LoginView（naive-ui 风格）——
 *  全屏背景 + 模糊层，白色圆角盒子：左图右表单；
 *  标题 32px 粗体、输入组（左侧标签）、紫色 Login、橙色 Go Student Client。 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/api/admin";
import { useUser } from "@/stores/userStore";
import { redirectToAdfsAuthorize } from "@/utils/sso";
import { SF_TEXT, tokens } from "@/utils/tokens";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setError(res.message || "Login failed");
      }
    } finally {
      setBusy(false);
    }
  };

  // 学生 SSO：跳转 CUHK ADFS /authorize（授权码授予流）
  const doSso = () => {
    redirectToAdfsAuthorize();
  };

  const groupLabelStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: "14px",
    paddingRight: "4px",
    color: tokens.fg3,
    flexShrink: 0,
    transition: "color 0.2s ease",
  };

  const groupInputStyle: React.CSSProperties = {
    flex: 1,
    fontSize: "15px",
    letterSpacing: "-0.1px",
    color: tokens.fg,
    border: "none",
    padding: "0 14px 0 8px",
    outline: "none",
    background: "transparent",
    boxSizing: "border-box",
    height: "46px",
    minWidth: 0,
  };

  // 输入组容器：白底 + 圆角描边，hover 加深、focus-within 紫色光环
  const groupWrapClass =
    "flex items-center w-full rounded-[10px] border border-[#e0e0e6] bg-white " +
    "shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 " +
    "hover:border-[#c3c3cc] " +
    "focus-within:border-[#763890] focus-within:ring-4 focus-within:ring-[#763890]/15 " +
    "[&_svg]:text-[#9a9aa3] focus-within:[&_svg]:text-[#763890]";

  const iconStroke = { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        height: "100vh",
        width: "100%",
        fontFamily: SF_TEXT,
        // LOGIN-BG.png 全屏背景（basePath /f/008 必须显式写出）
        background: "url(/f/008/assets/LOGIN-BG.png)",
        backgroundSize: "100%",
      }}
    >
      {/* 模糊层 */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      >
        {/* 白色盒子 */}
        <div
          className="flex"
          style={{
            borderRadius: "10px",
            backgroundColor: "#fff",
            border: "2px solid #f0f0f0",
            boxShadow: "0px 0px 7px #dddddd",
            overflow: "hidden",
          }}
        >
          {/* 左图（LOGIN-LEFT.png：独立框体包裹于父级框体中，上下左右居中，透明无感知） */}
          <div
            className="left-panel"
            style={{
              position: "relative",
              minWidth: "450px",
              width: "450px",
              height: "500px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
            }}
          >
            {/* 独立框体：结构独立、样式全透明，视觉与父级融为一体 */}
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/f/008/assets/LOGIN-LEFT.png"
                alt="left-bg"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </div>

          {/* 右表单（浅蓝底 #bbdefb，与原工程一致） */}
          <div
            className="flex flex-col items-center justify-center"
            style={{
              width: "500px",
              height: "500px",
              background: "#bbdefb",
              padding: "0 40px",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "28px", marginBottom: "32px", color: tokens.fg, textAlign: "center", width: "100%", whiteSpace: "nowrap" }}>
              Activity Management System
            </div>
            <div style={{ fontSize: "25px", marginBottom: "32px", color: tokens.fg, textAlign: "center", width: "100%" }}>
              IAO Login In
            </div>

            <form onSubmit={doLogin} style={{ width: "60%", minWidth: "260px" }}>
              <div className={groupWrapClass}>
                <span style={groupLabelStyle} aria-hidden>
                  <svg width="18" height="18" {...iconStroke}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  style={groupInputStyle}
                  placeholder="Please input username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className={groupWrapClass} style={{ marginTop: "16px", position: "relative" }}>
                <span style={groupLabelStyle} aria-hidden>
                  <svg width="18" height="18" {...iconStroke}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  style={{ ...groupInputStyle, paddingRight: "44px" }}
                  placeholder="Please input password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="transition-colors duration-200 hover:opacity-70"
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#9a9aa3",
                    display: "inline-flex",
                    padding: 0,
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" {...iconStroke}>
                      <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" {...iconStroke}>
                      <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {error && (
                <div style={{ marginTop: "12px", fontSize: "13px", color: tokens.error }}>{error}</div>
              )}

              <div style={{ marginTop: "24px" }}>
                <button
                  type="submit"
                  disabled={busy}
                  className="transition-opacity duration-150 hover:opacity-85 disabled:opacity-40"
                  style={{
                    width: "100%",
                    height: "34px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#fff",
                    background: tokens.accent,
                    border: `1px solid ${tokens.accent}`,
                    borderRadius: "3px",
                    cursor: busy ? "not-allowed" : "pointer",
                  }}
                >
                  {busy ? "Loading..." : "Login"}
                </button>
              </div>
              <div style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={doSso}
                  className="transition-opacity duration-150 hover:opacity-85"
                  style={{
                    width: "100%",
                    height: "34px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#fff",
                    background: "#ee9a00",
                    border: "1px solid #ee9a00",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  Go Student Client
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
