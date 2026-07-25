"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { formatPrice } from "@/lib/utils";
import { adminDashboardApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { DashboardStats } from "@/types/admin";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink-900 dark:text-neutral-50">{value}</p>
      </CardBody>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminDashboardApi
      .getStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Dashboard</h1>

      {error && (
        <Alert variant="error" className="mt-6">
          {error}
        </Alert>
      )}

      {!stats && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Orders" value={stats.totalOrders} />
            <StatCard label="Total Revenue" value={formatPrice(Number(stats.totalRevenue))} />
            <StatCard label="Total Products" value={stats.totalProducts} />
            <StatCard label="Total Users" value={stats.totalUsers} />
            <StatCard label="Pending Seller Applications" value={stats.pendingSellerApplications} />
            <StatCard label="Low Stock Variants" value={stats.lowStockVariants} />
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-semibold text-ink-900 dark:text-neutral-50">Recent Orders</h2>
            <Card>
              {stats.recentOrders.length === 0 ? (
                <CardBody>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No orders yet.</p>
                </CardBody>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-surface-800">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 text-sm">
                      <div>
                        <p className="font-medium text-ink-900 dark:text-neutral-100">{order.orderNumber}</p>
                        <p className="text-neutral-500 dark:text-neutral-400">
                          {new Date(order.placedAt).toLocaleDateString("en-NG")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="neutral">{order.status}</Badge>
                        <span className="font-medium text-ink-900 dark:text-neutral-100">
                          {formatPrice(Number(order.total))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/admin/catalog/products" className="text-sm font-medium text-brand-600 hover:underline dark:text-accent-400">
              Manage products →
            </Link>
            <Link href="/admin/catalog/categories" className="text-sm font-medium text-brand-600 hover:underline dark:text-accent-400">
              Manage categories →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
