"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils";
import { adminOrdersApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminOrderDetail, OrderStatus } from "@/types/admin";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>("PENDING");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    adminOrdersApi
      .getById(orderId)
      .then((res) => {
        setOrder(res.order);
        setNextStatus(res.order.status);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [orderId]);

  async function handleUpdateStatus() {
    setIsUpdating(true);
    setError(null);
    try {
      const res = await adminOrdersApi.updateStatus(orderId, nextStatus);
      setOrder(res.order);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setIsUpdating(false);
    }
  }

  if (error && !order) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
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
              {order.user ? `${order.user.firstName} ${order.user.lastName} (${order.user.email})` : "Guest"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Placed</span>
            <span className="text-ink-900">{new Date(order.placedAt).toLocaleString("en-NG")}</span>
          </div>
          {order.shippingAddress && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Shipping to</span>
              <span className="text-ink-900">
                {order.shippingAddress.fullName}, {order.shippingAddress.line1},{" "}
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-semibold text-ink-900">Items</p>
        </CardHeader>
        <CardBody className="divide-y divide-neutral-200 p-0">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between p-4 text-sm">
              <div>
                <p className="font-medium text-ink-900">{item.productNameSnapshot}</p>
                <p className="text-neutral-500">
                  {item.skuSnapshot} × {item.quantity}
                </p>
              </div>
              <p className="text-ink-900">{formatPrice(Number(item.subtotal), order.currency)}</p>
            </div>
          ))}
        </CardBody>
        <CardBody className="space-y-1 border-t border-neutral-200 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span className="text-ink-900">{formatPrice(Number(order.subtotal), order.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Shipping</span>
            <span className="text-ink-900">{formatPrice(Number(order.shippingFee), order.currency)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-ink-900">Total</span>
            <span className="text-ink-900">{formatPrice(Number(order.total), order.currency)}</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-semibold text-ink-900">Update status</p>
        </CardHeader>
        <CardBody className="flex flex-wrap items-end gap-3">
          <Select
            label="Status"
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
            className="max-w-xs"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Button onClick={handleUpdateStatus} isLoading={isUpdating}>
            Update status
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-semibold text-ink-900">Status history</p>
        </CardHeader>
        <CardBody className="divide-y divide-neutral-200 p-0">
          {order.statusHistory.map((entry) => (
            <div key={entry.id} className="flex justify-between p-4 text-sm">
              <span className="text-ink-900">{entry.status}</span>
              <span className="text-neutral-500">
                {new Date(entry.createdAt).toLocaleString("en-NG")}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
