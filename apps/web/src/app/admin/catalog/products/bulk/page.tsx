"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { adminProductsApi } from "@/lib/api/admin";
import type { CategorySummary } from "@/types/product";
import type { SellerSummary } from "@/types/seller";

const rowSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  brand: z.string().trim().min(1, "Required"),
  categoryId: z.string().min(1, "Required"),
  sellerId: z.string().min(1, "Required"),
  sku: z.string().trim().min(1, "Required"),
  description: z.string().trim().min(1, "Required"),
  basePrice: z.coerce.number().positive("Must be > 0"),
  stockQuantity: z.coerce.number().int().nonnegative("Must be 0 or more"),
  imageUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});

const bulkFormSchema = z.object({
  rows: z.array(rowSchema).min(1),
});

type BulkFormValues = z.infer<typeof bulkFormSchema>;

const emptyRow: BulkFormValues["rows"][number] = {
  name: "",
  brand: "",
  categoryId: "",
  sellerId: "",
  sku: "",
  description: "",
  basePrice: 0,
  stockQuantity: 0,
  imageUrl: "",
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BulkAddProductsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [sellers, setSellers] = useState<SellerSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ succeededCount: number; failed: Array<{ name: string; error: string }> } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BulkFormValues>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: { rows: [emptyRow, emptyRow, emptyRow] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rows" });

  useEffect(() => {
    Promise.all([
      apiRequest<{ categories: CategorySummary[] }>("/categories"),
      apiRequest<{ sellers: SellerSummary[] }>("/sellers"),
    ])
      .then(([categoryRes, sellerRes]) => {
        setCategories(categoryRes.categories);
        setSellers(sellerRes.sellers);
      })
      .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  async function onSubmit(values: BulkFormValues) {
    setSubmitError(null);
    setResult(null);
    try {
      const products = values.rows.map((row) => ({
        name: row.name,
        slug: slugify(row.name),
        brand: row.brand,
        categoryId: row.categoryId,
        sellerId: row.sellerId,
        sku: row.sku,
        description: row.description,
        basePrice: row.basePrice,
        stockQuantity: row.stockQuantity,
        currency: "NGN",
        status: "ACTIVE" as const,
        isFeatured: false,
        images: row.imageUrl ? [{ url: row.imageUrl, altText: row.name }] : [],
        variants: [],
      }));

      const res = await adminProductsApi.bulkCreate(products);
      setResult({
        succeededCount: res.succeeded.length,
        failed: res.failed.map((f) => ({ name: f.name, error: f.error })),
      });

      if (res.failed.length === 0) {
        setTimeout(() => router.push("/admin/catalog/products"), 1500);
      }
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">
          Bulk add products
        </h1>
        <Link href="/admin/catalog/products" className="text-sm font-medium text-brand-600 hover:underline dark:text-accent-400">
          Back to products
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Add up to 50 products at once, each with its own name, description, and price. Products are
        created independently — if one row has an error, the rest still go through.
      </p>

      {loadError && <Alert variant="error" className="mt-4">{loadError}</Alert>}
      {submitError && <Alert variant="error" className="mt-4">{submitError}</Alert>}

      {result && (
        <Alert variant={result.failed.length === 0 ? "success" : "warning"} className="mt-4">
          <p>
            {result.succeededCount} product{result.succeededCount === 1 ? "" : "s"} created successfully.
          </p>
          {result.failed.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.failed.map((f, i) => (
                <li key={i}>
                  <span className="font-medium">{f.name || `Row ${i + 1}`}</span>: {f.error}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="flex items-center justify-between">
              <p className="font-semibold text-ink-900 dark:text-neutral-100">Product {index + 1}</p>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  Remove
                </Button>
              )}
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Product name"
                  error={errors.rows?.[index]?.name?.message}
                  {...register(`rows.${index}.name`)}
                />
                <Input
                  label="Brand"
                  error={errors.rows?.[index]?.brand?.message}
                  {...register(`rows.${index}.brand`)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Select
                  label="Category"
                  error={errors.rows?.[index]?.categoryId?.message}
                  {...register(`rows.${index}.categoryId`)}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Seller"
                  error={errors.rows?.[index]?.sellerId?.message}
                  {...register(`rows.${index}.sellerId`)}
                >
                  <option value="">Select seller</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.storeName}
                    </option>
                  ))}
                </Select>
                <Input
                  label="SKU"
                  error={errors.rows?.[index]?.sku?.message}
                  {...register(`rows.${index}.sku`)}
                />
              </div>
              <Textarea
                label="Description"
                rows={3}
                error={errors.rows?.[index]?.description?.message}
                {...register(`rows.${index}.description`)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Price (NGN)"
                  type="number"
                  step="0.01"
                  error={errors.rows?.[index]?.basePrice?.message}
                  {...register(`rows.${index}.basePrice`)}
                />
                <Input
                  label="Stock quantity"
                  type="number"
                  error={errors.rows?.[index]?.stockQuantity?.message}
                  {...register(`rows.${index}.stockQuantity`)}
                />
              </div>
              <ImageUploadField
                label="Image (optional)"
                value={watch(`rows.${index}.imageUrl`) ?? ""}
                onChange={(url) => setValue(`rows.${index}.imageUrl`, url, { shouldValidate: true })}
              />
              {errors.rows?.[index]?.imageUrl?.message && (
                <p className="text-sm text-error">{errors.rows[index]?.imageUrl?.message}</p>
              )}
            </CardBody>
          </Card>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => append(emptyRow)}
            disabled={fields.length >= 50}
          >
            Add another product
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create {fields.length} product{fields.length === 1 ? "" : "s"}
          </Button>
        </div>
      </form>
    </div>
  );
}
