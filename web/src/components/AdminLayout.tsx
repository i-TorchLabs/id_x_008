"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/api/admin";
import { useUser } from "@/stores/userStore";
import AuthGuard from "./AuthGuard";
import { Modal, PillButton } from "./ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

const MENU = [
  { href: "/admin/project-management", label: "Project" },
  { href: "/admin/activity-management", label: "Activities" },
  { href: "/admin/report-export", label: "Report" },
];

const TITLE_MAP: Record<string, string> = {
  "/admin/project-management": "Project Management",
  "/admin/activity-management": "Activities",
  "/admin/report-export": "Report Export",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutLocal } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
    } catch {}
    logoutLocal();
    router.replace("/login");
  };

  const currentTitle = Object.entries(TITLE_MAP).find(([k]) => pathname?.startsWith(k))?.[1];

  return (
    <AuthGuard role="admin">
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: SF_TEXT }}>
        {/* ── 统一顶栏（横跨全宽）：Logo + 用户名 + 登出 ── */}
        <header
          className="flex items-center justify-between shrink-0"
          style={{
            height: "56px",
            padding: "0 16px",
            background: tokens.accent,
          }}
        >
          {/* 左侧：Logo（原样呈现） */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/f/008/assets/CUHKSZ.png"
            alt="CUHKSZ"
            style={{ height: "44px", width: "auto", flexShrink: 0 }}
          />

          {/* 右侧：用户名 + 登出 */}
          <div className="flex items-center gap-3 shrink-0">
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#ffffff" }}>
              {user?.name}
            </span>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              aria-label="Logout"
              title="Logout"
              className="transition-opacity duration-150 hover:opacity-75"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px",
              }}
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── 下方：侧栏 + 内容（flex 撑满剩余高度） ── */}
        <div className="flex flex-1 min-h-0">
          {/* 左侧菜单（白底） */}
          <aside
            className="shrink-0 flex flex-col"
            style={{
              width: "200px",
              background: tokens.card,
              borderRight: `1px solid ${tokens.divider}`,
            }}
          >
            {/* IAO 分组菜单 */}
            <div style={{ padding: "8px 0" }}>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: tokens.fg3,
                }}
              >
                Home
              </div>
              {MENU.map((m) => {
                const active = pathname?.startsWith(m.href);
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="transition-colors duration-150"
                    style={{
                      display: "block",
                      padding: "10px 16px 10px 28px",
                      fontSize: "14px",
                      fontWeight: active ? 600 : 400,
                      color: active ? tokens.accent : tokens.fg2,
                      background: active ? tokens.accentSoft : "transparent",
                      borderRight: active ? `2px solid ${tokens.accent}` : "2px solid transparent",
                      textDecoration: "none",
                    }}
                  >
                    {m.label}
                  </Link>
                );
              })}
            </div>
          </aside>

          {/* 右侧：面包屑 + 内容 */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* 面包屑（36px 白底） */}
            <div
              className="flex items-center shrink-0"
              style={{
                height: "36px",
                padding: "0 16px",
                background: tokens.card,
                borderBottom: `1px solid ${tokens.divider}`,
                fontSize: "13px",
                color: tokens.fg3,
              }}
            >
              <span>Admin</span>
              <span style={{ margin: "0 8px" }}>/</span>
              <span style={{ color: tokens.fg }}>{currentTitle ?? ""}</span>
            </div>

            {/* 灰色内容区 */}
            <main
              className="flex-1 min-h-0 overflow-y-auto"
              style={{ background: tokens.bg, padding: "8px" }}
            >
              {children}
            </main>
          </div>
        </div>
      </div>

      {/* 登出确认弹层 */}
      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Tips"
        footer={
          <>
            <PillButton onClick={() => setShowLogoutConfirm(false)}>Cancel</PillButton>
            <PillButton primary onClick={() => void handleLogout()}>Confirm</PillButton>
          </>
        }
      >
        <p style={{ fontFamily: SF_TEXT, fontSize: "14px", color: tokens.fg2, margin: 0 }}>
          Are you sure to exit?
        </p>
      </Modal>
    </AuthGuard>
  );
}
