"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/api/user";
import { useUser } from "@/stores/userStore";
import AuthGuard from "./AuthGuard";
import { Modal, PillButton } from "./ui";
import { SF_TEXT, tokens } from "@/utils/tokens";

const TITLE_MAP: Record<string, string> = {
  "/user/home": "Activities",
  "/user/records": "My Records",
  "/user/activity": "Apply",
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { logoutLocal } = useUser();
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
    <AuthGuard role="user">
      <div className="flex flex-col" style={{ height: "100vh", fontFamily: SF_TEXT }}>
        {/* ── 紫色顶栏（60px，n-layout-header） ── */}
        <header
          className="flex items-center justify-between shrink-0"
          style={{
            height: "60px",
            padding: "0 20px",
            background: tokens.accent,
          }}
        >
          <div />
          <span className="text-white" style={{ fontWeight: 700, fontSize: "15px" }}>
            {currentTitle ?? ""}
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

        {/* 灰色内容区 */}
        <main
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ background: tokens.bg, padding: "8px" }}
        >
          <div style={{ minWidth: "600px", maxWidth: "1400px", margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>

      {/* 登出确认弹层 */}
      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Tips"
        footer={
          <>
            <PillButton onClick={() => setShowLogoutConfirm(false)}>Cancel</PillButton>
            <PillButton
              primary
              onClick={handleLogout}
            >
              Confirm
            </PillButton>
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
