"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { SellerDashboardShell } from "@/components/seller/SellerDashboardShell";
import { formatPrice } from "@/lib/utils";
import { sellerDashboardApi } from "@/lib/api/seller-dashboard";
import { ApiRequestError } from "@/lib/api-client";
import type { SellerDashboardStats } from "@/types/seller-dashboard";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink-900">{value}</p>
      </CardBody>
    </Card>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<SellerDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sellerDashboardApi
      .getStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Seller Dashboard</h1>

      {error && (
        <Alert variant="error" className="mt-6">
          {error}
        </Alert>
      )}

      {!stats && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Products" value={stats.totalProducts} />
            <StatCard label="Low Stock Variants" value={stats.lowStockVariants} />
            <StatCard label="Order Items" value={stats.totalOrderItems} />
            <StatCard label="Revenue" value={formatPrice(Number(stats.totalRevenue))} />
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-semibold text-ink-900">Recent Order Items</h2>
            <Card>
              {stats.recentOrderItems.length === 0 ? (
                <CardBody>
                  <p className="text-sm text-neutral-500">No orders yet.</p>
                </CardBody>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {stats.recentOrderItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 text-sm">
                      <div>
                        <p className="font-medium text-ink-900">{item.productNameSnapshot}</p>
                        <p className="text-neutral-500">
                          {item.order.orderNumber} · Qty {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="neutral">{item.fulfillmentStatus}</Badge>
                        <span className="font-medium text-ink-900">
                          {formatPrice(Number(item.subtotal))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <SellerDashboardShell>
      <DashboardContent />
    </SellerDashboardShell>
  );
}
