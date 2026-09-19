import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/stores/userStore";

export const metadata: Metadata = {
  title: "SME IAO AMS",
  description: "SME IAO 1v1 Consulting Appointment Platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
