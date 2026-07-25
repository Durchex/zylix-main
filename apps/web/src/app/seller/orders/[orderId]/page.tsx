import { SellerDashboardShell } from "@/components/seller/SellerDashboardShell";
import { SellerOrderDetailView } from "@/app/seller/orders/[orderId]/SellerOrderDetailView";

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <SellerDashboardShell>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Order Detail</h1>
      <div className="mt-6 max-w-2xl">
        <SellerOrderDetailView orderId={orderId} />
      </div>
    </SellerDashboardShell>
  );
}
