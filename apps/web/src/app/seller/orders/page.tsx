"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { SellerDashboardShell } from "@/components/seller/SellerDashboardShell";
import { formatPrice } from "@/lib/utils";
import { sellerOrdersApi } from "@/lib/api/seller-dashboard";
import { ApiRequestError } from "@/lib/api-client";
import type { SellerOrderSummary } from "@/types/seller-dashboard";

function OrdersContent() {
  const [orders, setOrders] = useState<SellerOrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sellerOrdersApi
      .list()
      .then((res) => setOrders(res.items))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Orders</h1>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!orders ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No orders yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Your items</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/seller/orders/${order.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                    {formatPrice(order.items.reduce((sum, i) => sum + Number(i.subtotal), 0))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">
                      {new Date(order.placedAt).toLocaleDateString("en-NG")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <SellerDashboardShell>
      <OrdersContent />
    </SellerDashboardShell>
  );
}
