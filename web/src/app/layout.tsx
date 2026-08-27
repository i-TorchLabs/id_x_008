import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/stores/userStore";

export const metadata: Metadata = {
  title: "SME IAO 预约系统",
  description: "经管学院国际事务办公室 1v1 咨询预约平台",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
