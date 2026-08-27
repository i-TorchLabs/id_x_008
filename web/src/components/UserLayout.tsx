"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/stores/userStore";
import AuthGuard from "./AuthGuard";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutLocal } = useUser();
  const router = useRouter();

  return (
    <AuthGuard role="user">
      <div className="min-h-screen">
        <header className="bg-[#7a0026] text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="text-lg font-semibold">SME IAO 1v1 咨询预约</div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/user/home" className="hover:underline">活动浏览</Link>
              <Link href="/user/records" className="hover:underline">我的记录</Link>
              <span className="text-white/70">{user?.name}</span>
              <button
                className="rounded bg-white/10 px-3 py-1 hover:bg-white/20"
                onClick={() => { logoutLocal(); router.replace("/login"); }}
              >
                退出
              </button>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
