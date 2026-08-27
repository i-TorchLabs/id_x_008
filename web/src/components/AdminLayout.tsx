"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/api/admin";
import { useUser } from "@/stores/userStore";
import AuthGuard from "./AuthGuard";

const MENU = [
  { href: "/admin/project-management", label: "项目管理" },
  { href: "/admin/activity-management", label: "活动管理" },
  { href: "/admin/report-export", label: "报表导出" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logoutLocal } = useUser();
  const router = useRouter();

  return (
    <AuthGuard role="admin">
      <div className="flex min-h-screen">
        <aside className="w-52 shrink-0 bg-[#7a0026] text-white">
          <div className="px-4 py-5 text-lg font-semibold">SME IAO 管理端</div>
          <nav className="flex flex-col">
            {MENU.map((m) => (
              <Link key={m.href} href={m.href} className="px-4 py-3 text-sm hover:bg-white/10">
                {m.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1">
          <header className="flex items-center justify-between border-b bg-white px-6 py-3">
            <span className="text-sm text-gray-500">管理员：{user?.name}</span>
            <button
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              onClick={async () => {
                await logout();
                logoutLocal();
                router.replace("/login");
              }}
            >
              退出登录
            </button>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
