"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminSellersApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminSeller } from "@/types/admin";

export function SellerDetailView({ sellerId }: { sellerId: string }) {
  const [seller, setSeller] = useState<AdminSeller | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => {
    adminSellersApi
      .getById(sellerId)
      .then((res) => setSeller(res.seller))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [sellerId]);

  async function handleApprove() {
    setIsActioning(true);
    try {
      const res = await adminSellersApi.approve(sellerId);
      setSeller(res.seller);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setIsActioning(false);
    }
  }

  async function handleReject() {
    const reason = prompt("Reason for rejection (optional):") ?? undefined;
    setIsActioning(true);
    try {
      const res = await adminSellersApi.reject(sellerId, reason);
      setSeller(res.seller);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setIsActioning(false);
    }
  }

  if (error && !seller) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!seller) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-semibold text-ink-900">{seller.storeName}</p>
          <Badge variant="brand">{seller.status}</Badge>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Owner</span>
            <span className="text-ink-900">
              {seller.user.firstName} {seller.user.lastName} ({seller.user.email})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Products listed</span>
            <span className="text-ink-900">{seller._count.products}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Applied</span>
            <span className="text-ink-900">{new Date(seller.createdAt).toLocaleDateString("en-NG")}</span>
          </div>
          {seller.description && (
            <p className="pt-2 text-neutral-600">{seller.description}</p>
          )}
        </CardBody>
      </Card>

      {seller.status === "PENDING" && (
        <div className="flex gap-3">
          <Button isLoading={isActioning} onClick={handleApprove}>
            Approve seller
          </Button>
          <Button variant="destructive" isLoading={isActioning} onClick={handleReject}>
            Reject application
          </Button>
        </div>
      )}
    </div>
  );
}
