"use client";

import { SellerDashboardShell } from "@/components/seller/SellerDashboardShell";
import { SellerProductForm } from "@/app/seller/products/SellerProductForm";

export default function NewSellerProductPage() {
  return (
    <SellerDashboardShell>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Add Product</h1>
      <div className="mt-6 max-w-3xl">
        <SellerProductForm />
      </div>
    </SellerDashboardShell>
  );
}
