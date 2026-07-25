"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { adminProductsApi } from "@/lib/api/admin";
import type { AdminProduct } from "@/types/admin";
import type { CategorySummary } from "@/types/product";
import type { SellerSummary } from "@/types/seller";

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  brand: z.string().trim().min(1, "Brand is required"),
  categoryId: z.string().min(1, "Category is required"),
  sellerId: z.string().min(1, "Seller is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  description: z.string().trim().min(1, "Description is required"),
  basePrice: z.coerce.number().positive("Price must be greater than 0"),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  currency: z.string().trim().min(1).default("NGN"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isFeatured: z.boolean().default(false),
  stockQuantity: z.coerce.number().int().nonnegative().default(0),
  images: z.array(z.object({ url: z.string().url("Enter a valid image URL"), altText: z.string().optional() })),
  variants: z.array(
    z.object({
      sku: z.string().trim().min(1),
      name: z.string().trim().min(1),
      price: z.coerce.number().positive(),
      stockQuantity: z.coerce.number().int().nonnegative(),
      isDefault: z.boolean().default(false),
    }),
  ),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const defaultValues: ProductFormValues = {
  name: "",
  slug: "",
  brand: "",
  categoryId: "",
  sellerId: "",
  sku: "",
  description: "",
  basePrice: 0,
  currency: "NGN",
  status: "DRAFT",
  isFeatured: false,
  stockQuantity: 0,
  images: [],
  variants: [],
};

function toFormValues(product: AdminProduct): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryId: product.category.id,
    sellerId: product.seller.id,
    sku: product.sku,
    description: product.description,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
    currency: product.currency,
    status: product.status,
    isFeatured: product.isFeatured,
    stockQuantity: product.stockQuantity,
    images: product.images.map((img) => ({ url: img.url, altText: img.altText ?? "" })),
    variants: product.variants.map((v) => ({
      sku: v.sku,
      name: v.name,
      price: Number(v.price),
      stockQuantity: v.stockQuantity,
      isDefault: v.isDefault,
    })),
  };
}

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [sellers, setSellers] = useState<SellerSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const imageFields = useFieldArray({ control, name: "images" });
  const variantFields = useFieldArray({ control, name: "variants" });

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

    if (productId) {
      adminProductsApi
        .getById(productId)
        .then((res) => reset(toFormValues(res.product)))
        .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
    }
  }, [productId, reset]);

  async function onSubmit(values: ProductFormValues) {
    setSubmitError(null);
    try {
      if (productId) {
        await adminProductsApi.update(productId, values);
      } else {
        await adminProductsApi.create(values);
      }
      router.push("/admin/catalog/products");
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {loadError && <Alert variant="error">{loadError}</Alert>}
      {submitError && <Alert variant="error">{submitError}</Alert>}

      <Card>
        <CardHeader>
          <p className="font-semibold text-ink-900 dark:text-neutral-100">Basic information</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Product name" error={errors.name?.message} {...register("name")} />
            <Input label="Slug" error={errors.slug?.message} {...register("slug")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Brand" error={errors.brand?.message} {...register("brand")} />
            <Input label="SKU" error={errors.sku?.message} {...register("sku")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
            <Select label="Seller" error={errors.sellerId?.message} {...register("sellerId")}>
              <option value="">Select seller</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.storeName}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            label="Description"
            rows={5}
            error={errors.description?.message}
            {...register("description")}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-semibold text-ink-900 dark:text-neutral-100">Pricing & status</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Base price (NGN)"
              type="number"
              step="0.01"
              error={errors.basePrice?.message}
              {...register("basePrice")}
            />
            <Input
              label="Compare-at price (optional)"
              type="number"
              step="0.01"
              error={errors.compareAtPrice?.message}
              {...register("compareAtPrice")}
            />
            <Select label="Status" {...register("status")}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <Checkbox label="Featured product" {...register("isFeatured")} />
          <div className="max-w-xs">
            <Input
              label="Stock quantity"
              type="number"
              helperText={
                variantFields.fields.length > 0
                  ? "Ignored — this product has variants, so stock is tracked per-variant below."
                  : "Used directly since this product has no variants."
              }
              error={errors.stockQuantity?.message}
              {...register("stockQuantity")}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-semibold text-ink-900 dark:text-neutral-100">Images</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => imageFields.append({ url: "", altText: "" })}
          >
            Add image
          </Button>
        </CardHeader>
        <CardBody className="space-y-3">
          {imageFields.fields.length === 0 && (
            <p className="text-sm text-neutral-500">No images added yet.</p>
          )}
          {imageFields.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 dark:border-surface-800">
              <ImageUploadField
                value={watch(`images.${index}.url`)}
                onChange={(url) => setValue(`images.${index}.url`, url, { shouldValidate: true })}
                className="flex-1"
              />
              <div className="flex flex-1 flex-col gap-2">
                <Input
                  label="Alt text"
                  placeholder="Describe the image"
                  {...register(`images.${index}.altText`)}
                />
                {errors.images?.[index]?.url?.message && (
                  <p className="text-sm text-error">{errors.images[index]?.url?.message}</p>
                )}
              </div>
              <Button type="button" variant="ghost" onClick={() => imageFields.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-semibold text-ink-900 dark:text-neutral-100">Variants</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              variantFields.append({ sku: "", name: "", price: 0, stockQuantity: 0, isDefault: false })
            }
          >
            Add variant
          </Button>
        </CardHeader>
        <CardBody className="space-y-3">
          {variantFields.fields.length === 0 && (
            <p className="text-sm text-neutral-500">
              No variants — the product will sell using the base price only.
            </p>
          )}
          {variantFields.fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-5">
              <Input placeholder="SKU" {...register(`variants.${index}.sku`)} />
              <Input placeholder="Name (e.g. 256GB)" {...register(`variants.${index}.name`)} />
              <Input placeholder="Price" type="number" step="0.01" {...register(`variants.${index}.price`)} />
              <Input placeholder="Stock" type="number" {...register(`variants.${index}.stockQuantity`)} />
              <Button type="button" variant="ghost" onClick={() => variantFields.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </CardBody>
      </Card>

      <Button type="submit" isLoading={isSubmitting}>
        {productId ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
