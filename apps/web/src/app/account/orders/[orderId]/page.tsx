"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import type { OrderDetail, OrderStatus } from "@/types/order";

const STATUS_VARIANT: Record<OrderStatus, "neutral" | "brand" | "success" | "warning" | "error" | "info"> = {
  PENDING: "warning",
  PAID: "info",
  PROCESSING: "info",
  SHIPPED: "brand",
  DELIVERED: "success",
  CANCELLED: "error",
  REFUNDED: "neutral",
};

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ order: OrderDetail }>(`/orders/mine/${params.orderId}`)
      .then((res) => setOrder(res.order))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [params.orderId]);

  if (error) {
    return (
      <Alert variant="error" className="mt-4">
        {error}
      </Alert>
    );
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-brand-600 underline underline-offset-2">
        &larr; Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">{order.orderNumber}</h1>
        <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Placed{" "}
        {new Date(order.placedAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>

      {order.statusHistory.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <p className="font-semibold text-ink-900">Tracking</p>
          </CardHeader>
          <CardBody>
            <ol className="space-y-3">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-900">{entry.status}</span>
                  <span className="text-neutral-500">{new Date(entry.createdAt).toLocaleString("en-NG")}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <p className="font-semibold text-ink-900">Items</p>
        </CardHeader>
        <CardBody className="divide-y divide-neutral-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
                {item.product.images[0] ? (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.images[0].altText ?? item.productNameSnapshot}
                    fill
                    className="object-contain p-2"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="line-clamp-1 text-sm font-medium text-ink-900 hover:text-brand-600"
                >
                  {item.productNameSnapshot}
                </Link>
                <p className="text-xs text-neutral-500">
                  Qty {item.quantity} · {formatPrice(item.unitPrice, order.currency)} each
                </p>
              </div>
              <p className="text-sm font-semibold text-ink-900">{formatPrice(item.subtotal, order.currency)}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="font-semibold text-ink-900">Shipping address</p>
          </CardHeader>
          <CardBody className="text-sm text-neutral-600">
            {order.shippingAddress ? (
              <>
                <p className="text-ink-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </p>
                <p>{order.shippingAddress.country}</p>
              </>
            ) : (
              <p>No shipping address on file.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-semibold text-ink-900">Order summary</p>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-ink-900">{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Shipping</span>
              <span className="text-ink-900">{formatPrice(order.shippingFee, order.currency)}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Discount</span>
                <span className="text-ink-900">-{formatPrice(order.discountTotal, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
              <span className="text-ink-900">Total</span>
              <span className="text-ink-900">{formatPrice(order.total, order.currency)}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
