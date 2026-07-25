import { OrderDetailView } from "@/app/admin/orders/[orderId]/OrderDetailView";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Order Detail</h1>
      <div className="mt-6 max-w-2xl">
        <OrderDetailView orderId={orderId} />
      </div>
    </div>
  );
}
