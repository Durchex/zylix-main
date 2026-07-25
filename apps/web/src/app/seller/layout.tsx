"use client";

import { AuthGuard } from "@/components/providers/AuthGuard";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { SellerFooter } from "@/components/seller/SellerFooter";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["CUSTOMER", "SELLER"]}>
      <div className="flex min-h-screen bg-neutral-50">
        <SellerSidebar />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-6 lg:p-8">{children}</main>
          <SellerFooter />
        </div>
      </div>
    </AuthGuard>
  );
}
