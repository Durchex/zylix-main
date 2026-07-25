import { SellerTable } from "@/app/admin/sellers/SellerTable";

export default function AdminSellerApplicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Pending Seller Applications</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Durchex D.A.M is the sole seller at launch — approving an application here is what opens
        the marketplace to that seller.
      </p>
      <div className="mt-6">
        <SellerTable statusFilter="PENDING" />
      </div>
    </div>
  );
}
