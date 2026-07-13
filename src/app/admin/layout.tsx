"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col lg:flex-row">
      <AdminNav />
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
