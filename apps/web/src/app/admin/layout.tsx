"use client";

import { AuthGuard } from "@/components/providers/AuthGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminFooter } from "@/components/admin/AdminFooter";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-surface-950 lg:flex-row">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-6 lg:p-8">{children}</main>
          <AdminFooter />
        </div>
      </div>
    </AuthGuard>
  );
}
