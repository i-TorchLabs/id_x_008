"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/stores/userStore";

export default function AuthGuard({
  role,
  children,
}: {
  role: "admin" | "user";
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      const timer = setTimeout(() => {
        const raw = localStorage.getItem("iao_user");
        if (!raw) router.replace("/login");
      }, 300);
      return () => clearTimeout(timer);
    }
    if (user.role !== role) {
      // 已登录但角色不符：跳回各自首页，而非登录页
      router.replace(role === "admin" ? "/user/home" : "/admin/project-management");
    }
  }, [user, role, router]);

  if (!user || user.role !== role) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }
  return <>{children}</>;
}
