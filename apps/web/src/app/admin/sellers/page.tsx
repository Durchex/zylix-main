import Link from "next/link";
import { SellerTable } from "@/app/admin/sellers/SellerTable";

export default function AdminSellersPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Sellers</h1>
        <Link href="/admin/sellers/applications" className="text-sm font-medium text-brand-600 hover:underline">
          View pending applications →
        </Link>
      </div>
      <div className="mt-6">
        <SellerTable />
      </div>
    </div>
  );
}
