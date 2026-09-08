"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminBrandsApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminBrand } from "@/types/admin";
import { BrandFormDialog, type BrandFormValues } from "@/app/admin/catalog/brands/BrandFormDialog";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<AdminBrand[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<AdminBrand | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    adminBrandsApi
      .list()
      .then((res) => {
        setError(null);
        setBrands(res.brands);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingBrand(null);
    setSubmitError(null);
    setDialogOpen(true);
  }

  function openEdit(brand: AdminBrand) {
    setEditingBrand(brand);
    setSubmitError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: BrandFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // The API rejects an empty string for the optional URL field, so an
      // untouched logo input is sent as omitted rather than "".
      const payload = { ...values, logoUrl: values.logoUrl || undefined };
      if (editingBrand) {
        await adminBrandsApi.update(editingBrand.id, payload);
      } else {
        await adminBrandsApi.create(payload);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(brand: AdminBrand) {
    if (!confirm(`Delete "${brand.name}"? This cannot be undone.`)) return;
    try {
      await adminBrandsApi.remove(brand.id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Brands</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Brands added here appear in the Brand dropdown when creating a product.
          </p>
        </div>
        <Button onClick={openCreate}>Add brand</Button>
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!brands ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">
            No brands yet — add one so products can be assigned to it.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {brands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <span className="relative h-8 w-14 shrink-0 overflow-hidden rounded border border-neutral-200 bg-white">
                          <Image src={brand.logoUrl} alt="" fill className="object-contain p-1" />
                        </span>
                      ) : (
                        <span className="flex h-8 w-14 shrink-0 items-center justify-center rounded border border-dashed border-neutral-300 text-[10px] text-neutral-400">
                          No logo
                        </span>
                      )}
                      <span className="font-medium text-ink-900">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{brand.slug}</td>
                  <td className="px-4 py-3 text-neutral-500">{brand._count.products}</td>
                  <td className="px-4 py-3">
                    <Badge variant={brand.isActive ? "success" : "neutral"}>
                      {brand.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(brand)}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(brand)}
                        className="text-sm font-medium text-error hover:underline"
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

      <BrandFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        brand={editingBrand}
        submitError={submitError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
