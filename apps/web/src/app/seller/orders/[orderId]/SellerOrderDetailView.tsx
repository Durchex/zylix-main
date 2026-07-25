"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils";
import { sellerOrdersApi } from "@/lib/api/seller-dashboard";
import { ApiRequestError } from "@/lib/api-client";
import type { FulfillmentStatus, SellerOrderDetail } from "@/types/seller-dashboard";

const FULFILLMENT_OPTIONS: FulfillmentStatus[] = [
  "UNFULFILLED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function SellerOrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    sellerOrdersApi
      .getById(orderId)
      .then((res) => setOrder(res.order))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [orderId]);

  async function handleFulfillmentChange(itemId: string, fulfillmentStatus: FulfillmentStatus) {
    setUpdatingItemId(itemId);
    setError(null);
    try {
      await sellerOrdersApi.updateFulfillment(orderId, itemId, fulfillmentStatus);
      const res = await sellerOrdersApi.getById(orderId);
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  if (error && !order) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!order) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-semibold text-ink-900">{order.orderNumber}</p>
          <Badge variant="brand">{order.status}</Badge>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Customer</span>
            <span className="text-ink-900">
              {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}
            </span>
          </div>
          {order.shippingAddress && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Shipping to</span>
              <span className="text-ink-900">
                {order.shippingAddress.fullName}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.state}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-semibold text-ink-900">Your items in this order</p>
        </CardHeader>
        <CardBody className="divide-y divide-neutral-200 p-0">
          {order.items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium text-ink-900">{item.productNameSnapshot}</p>
                <p className="text-neutral-500">
                  {item.skuSnapshot} · Qty {item.quantity} · {formatPrice(Number(item.subtotal))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={item.fulfillmentStatus}
                  onChange={(e) =>
                    handleFulfillmentChange(item.id, e.target.value as FulfillmentStatus)
                  }
                  className="w-40"
                >
                  {FULFILLMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                {updatingItemId === item.id && <Button size="sm" isLoading disabled />}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
