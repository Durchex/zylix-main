"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminSellersApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminSeller, SellerStatus } from "@/types/admin";

const statusBadgeVariant: Record<SellerStatus, "success" | "neutral" | "warning" | "error"> = {
  APPROVED: "success",
  PENDING: "warning",
  SUSPENDED: "neutral",
  REJECTED: "error",
};

export function SellerTable({ statusFilter }: { statusFilter?: SellerStatus }) {
  const [sellers, setSellers] = useState<AdminSeller[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(() => {
    adminSellersApi
      .list({ status: statusFilter })
      .then((res) => {
        setError(null);
        setSellers(res.items);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id: string) {
    setActioningId(id);
    try {
      await adminSellersApi.approve(id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Reason for rejection (optional):") ?? undefined;
    setActioningId(id);
    try {
      await adminSellersApi.reject(id, reason);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!sellers ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No sellers found.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sellers.map((seller) => (
                <tr key={seller.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sellers/${seller.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {seller.storeName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {seller.user.firstName} {seller.user.lastName}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{seller._count.products}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant[seller.status]}>{seller.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {seller.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          isLoading={actioningId === seller.id}
                          onClick={() => handleApprove(seller.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          isLoading={actioningId === seller.id}
                          onClick={() => handleReject(seller.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
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
