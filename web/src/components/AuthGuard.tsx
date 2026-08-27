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
        const raw = localStorage.getItem("aa_user");
        if (!raw) router.replace("/login");
      }, 300);
      return () => clearTimeout(timer);
    }
    if (user.role !== role) router.replace("/login");
  }, [user, role, router]);

  if (!user || user.role !== role) {
    return <div className="p-10 text-center text-gray-500">加载中...</div>;
  }
  return <>{children}</>;
}
