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
  { href: "/admin/project-management", label: "Subject" },
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
      <div className="flex" style={{ height: "100vh", fontFamily: SF_TEXT }}>
        {/* ── 左侧菜单（n-layout-sider：白底 + 紫色 Logo 栏） ── */}
        <aside
          className="shrink-0 flex flex-col"
          style={{
            width: "200px",
            background: tokens.card,
            borderRight: `1px solid ${tokens.divider}`,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              height: "60px",
              background: tokens.accent,
              borderBottom: `1px solid ${tokens.divider}`,
              padding: "0 8px",
            }}
          >
            <span className="text-white" style={{ fontSize: "15px", fontWeight: 700 }}>
              SME IAO Admin
            </span>
          </div>
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
              IAO
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

        {/* ── 右侧主区域 ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* 紫色顶栏（60px） */}
          <header
            className="flex items-center justify-between shrink-0"
            style={{
              height: "60px",
              padding: "0 20px",
              background: tokens.accent,
            }}
          >
            <span className="text-white" style={{ fontWeight: 700, fontSize: "15px" }}>
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
          </header>

          {/* 面包屑（40px） */}
          <div
            className="flex items-center shrink-0"
            style={{
              height: "40px",
              padding: "0 8px",
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

      {/* 登出确认弹层 */}
      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Tips"
        footer={
          <>
            <PillButton onClick={() => setShowLogoutConfirm(false)}>Cancle</PillButton>
            <PillButton primary onClick={() => void handleLogout()}>Confirm</PillButton>
          </>
        }
      >
        <p style={{ fontFamily: SF_TEXT, fontSize: "14px", color: tokens.fg2, margin: 0 }}>
          Are you sure to exist?
        </p>
      </Modal>
    </AuthGuard>
  );
}
