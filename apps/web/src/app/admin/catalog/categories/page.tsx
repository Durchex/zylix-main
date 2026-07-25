"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminCategoriesApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminCategory } from "@/types/admin";
import { CategoryFormDialog, type CategoryFormValues } from "@/app/admin/catalog/categories/CategoryFormDialog";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    adminCategoriesApi
      .list()
      .then((res) => {
        setError(null);
        setCategories(res.categories);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingCategory(null);
    setSubmitError(null);
    setDialogOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditingCategory(category);
    setSubmitError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: CategoryFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (editingCategory) {
        await adminCategoriesApi.update(editingCategory.id, values);
      } else {
        await adminCategoriesApi.create(values);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(category: AdminCategory) {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    try {
      await adminCategoriesApi.remove(category.id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Categories</h1>
        <Button onClick={openCreate}>Add category</Button>
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!categories ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No categories yet.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{category.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{category.slug}</td>
                  <td className="px-4 py-3 text-neutral-500">{category._count.products}</td>
                  <td className="px-4 py-3">
                    <Badge variant={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
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

      <CategoryFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        category={editingCategory}
        submitError={submitError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
