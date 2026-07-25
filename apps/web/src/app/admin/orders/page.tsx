"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils";
import { adminOrdersApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminOrderSummary, OrderStatus } from "@/types/admin";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const statusBadgeVariant: Record<OrderStatus, "success" | "neutral" | "warning" | "error" | "brand"> = {
  PENDING: "neutral",
  PAID: "brand",
  PROCESSING: "warning",
  SHIPPED: "brand",
  DELIVERED: "success",
  CANCELLED: "error",
  REFUNDED: "error",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    adminOrdersApi
      .list({ status: (status as OrderStatus) || undefined, search: search || undefined })
      .then((res) => {
        setError(null);
        setOrders(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search by order number or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!orders ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No orders found.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}
                  </td>
                  <td className="px-4 py-3 text-ink-900">
                    {formatPrice(Number(order.total), order.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant[order.status]}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(order.placedAt).toLocaleDateString("en-NG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {orders && <p className="mt-3 text-sm text-neutral-500">{total} order{total === 1 ? "" : "s"} total</p>}
    </div>
  );
}
