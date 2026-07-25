"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils";
import { adminProductsApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminProduct } from "@/types/admin";

const statusBadgeVariant: Record<AdminProduct["status"], "success" | "neutral" | "warning"> = {
  ACTIVE: "success",
  DRAFT: "neutral",
  ARCHIVED: "warning",
};

// A product with variants tracks stock per-variant — "in stock" here means at
// least one variant has stock, and toggling doesn't apply (it'd wipe
// individual variant quantities), so those go to the edit page instead.
function isInStock(product: AdminProduct): boolean {
  return product.variants.length > 0
    ? product.variants.some((v) => v.stockQuantity > 0)
    : product.stockQuantity > 0;
}

const RESTOCK_DEFAULT_QUANTITY = 50;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(() => {
    adminProductsApi
      .list({ search: search || undefined, status: (status as AdminProduct["status"]) || undefined })
      .then((res) => {
        setError(null);
        setProducts(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await adminProductsApi.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleStock(product: AdminProduct) {
    setTogglingId(product.id);
    try {
      const nextQuantity = isInStock(product) ? 0 : RESTOCK_DEFAULT_QUANTITY;
      await adminProductsApi.update(product.id, { stockQuantity: nextQuantity });
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Products</h1>
        <div className="flex gap-3">
          <Link href="/admin/catalog/products/bulk">
            <Button variant="outline">Bulk add</Button>
          </Link>
          <Link href="/admin/catalog/products/new">
            <Button>Add product</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search by name, SKU, or brand"
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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white dark:border-surface-800 dark:bg-surface-900">
        {!products ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500 dark:text-neutral-400">No products found.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-surface-800 dark:bg-surface-800 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-surface-800">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-neutral-100">{product.name}</td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{product.sku}</td>
                  <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{product.category.name}</td>
                  <td className="px-4 py-3 text-ink-900 dark:text-neutral-100">{formatPrice(Number(product.basePrice))}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant[product.status]}>{product.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {product.variants.length > 0 ? (
                      <span
                        className="text-xs text-neutral-400 dark:text-neutral-500"
                        title="This product has variants — manage stock per-variant from Edit."
                      >
                        Per-variant
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleStock(product)}
                        disabled={togglingId === product.id}
                        className="disabled:opacity-50"
                        title={isInStock(product) ? "Click to mark out of stock" : "Click to mark in stock"}
                      >
                        <Badge variant={isInStock(product) ? "success" : "error"}>
                          {isInStock(product) ? "In stock" : "Out of stock"}
                        </Badge>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/catalog/products/${product.id}`}
                        className="text-sm font-medium text-brand-600 hover:underline dark:text-accent-400"
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

      {products && (
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{total} product{total === 1 ? "" : "s"} total</p>
      )}
    </div>
  );
}
