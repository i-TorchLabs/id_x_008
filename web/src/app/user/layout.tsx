import UserLayout from "@/components/UserLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <UserLayout>{children}</UserLayout>;
}
