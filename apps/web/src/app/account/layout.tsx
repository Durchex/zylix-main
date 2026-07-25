"use client";

import { AuthGuard } from "@/components/providers/AuthGuard";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
        <AccountSidebar />
        <div className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}
