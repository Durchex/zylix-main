"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { SellerDashboardShell } from "@/components/seller/SellerDashboardShell";
import { formatPrice } from "@/lib/utils";
import { sellerProductsApi } from "@/lib/api/seller-dashboard";
import { ApiRequestError } from "@/lib/api-client";
import type { SellerProduct } from "@/types/seller-dashboard";

const statusBadgeVariant: Record<SellerProduct["status"], "success" | "neutral" | "warning"> = {
  ACTIVE: "success",
  DRAFT: "neutral",
  ARCHIVED: "warning",
};

function ProductsContent() {
  const [products, setProducts] = useState<SellerProduct[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    sellerProductsApi
      .list({ search: search || undefined, status: status || undefined })
      .then((res) => {
        setError(null);
        setProducts(res.items);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    try {
      await sellerProductsApi.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">My Products</h1>
        <Link href="/seller/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!products ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No products yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{product.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{product.sku}</td>
                  <td className="px-4 py-3 text-ink-900">{formatPrice(Number(product.basePrice))}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant[product.status]}>{product.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/seller/products/${product.id}/edit`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="text-sm font-medium text-error hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
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

export default function SellerProductsPage() {
  return (
    <SellerDashboardShell>
      <ProductsContent />
    </SellerDashboardShell>
  );
}
