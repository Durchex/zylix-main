"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import type { OrderSummary, OrderStatus } from "@/types/order";
import type { PaginatedResult } from "@/types/product";

const STATUS_VARIANT: Record<OrderStatus, "neutral" | "brand" | "success" | "warning" | "error" | "info"> = {
  PENDING: "warning",
  PAID: "info",
  PROCESSING: "info",
  SHIPPED: "brand",
  DELIVERED: "success",
  CANCELLED: "error",
  REFUNDED: "neutral",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<PaginatedResult<OrderSummary>>("/orders/mine?pageSize=20")
      .then((res) => setOrders(res.items))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Orders</h1>
      <p className="mt-1 text-sm text-neutral-500">Track packages and review your order history.</p>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 space-y-4">
        {!orders ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/shop"
              className="mt-3 inline-block text-sm font-medium text-brand-600 underline underline-offset-2"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-elevated"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink-900">{order.orderNumber}</p>
                  <p className="text-xs text-neutral-500">
                    Placed{" "}
                    {new Date(order.placedAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {order.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-neutral-50"
                    >
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.images[0].altText ?? item.productNameSnapshot}
                          fill
                          className="object-contain p-1"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-neutral-600">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"}
                </p>
                <p className="ml-auto text-sm font-semibold text-ink-900">
                  {formatPrice(order.total, order.currency)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
