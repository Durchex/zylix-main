"use client";

import { useEffect, useState } from "react";
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
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { sellerProductsApi } from "@/lib/api/seller-dashboard";
import type { SellerProduct } from "@/types/seller-dashboard";
import type { CategorySummary } from "@/types/product";

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  brand: z.string().trim().min(1, "Brand is required"),
  categoryId: z.string().min(1, "Category is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  description: z.string().trim().min(1, "Description is required"),
  basePrice: z.coerce.number().positive("Price must be greater than 0"),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal("").transform(() => undefined)),
  currency: z.string().trim().min(1).default("NGN"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
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
  sku: "",
  description: "",
  basePrice: 0,
  currency: "NGN",
  status: "DRAFT",
  images: [],
  variants: [],
};

function toFormValues(product: SellerProduct): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryId: product.category.id,
    sku: product.sku,
    description: product.description,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
    currency: product.currency,
    status: product.status,
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

export function SellerProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues });

  const imageFields = useFieldArray({ control, name: "images" });
  const variantFields = useFieldArray({ control, name: "variants" });

  useEffect(() => {
    apiRequest<{ categories: CategorySummary[] }>("/categories")
      .then((res) => setCategories(res.categories))
      .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Something went wrong."));

    if (productId) {
      sellerProductsApi
        .getById(productId)
        .then((res) => reset(toFormValues(res.product)))
        .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
    }
  }, [productId, reset]);

  async function onSubmit(values: ProductFormValues) {
    setSubmitError(null);
    try {
      if (productId) {
        await sellerProductsApi.update(productId, values);
      } else {
        await sellerProductsApi.create(values);
      }
      router.push("/seller/products");
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
          <p className="font-semibold text-ink-900">Basic information</p>
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
          <Select label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
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
          <p className="font-semibold text-ink-900">Pricing & status</p>
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
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-semibold text-ink-900">Images</p>
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
            <div key={field.id} className="flex gap-3">
              <Input
                placeholder="https://res.cloudinary.com/..."
                error={errors.images?.[index]?.url?.message}
                {...register(`images.${index}.url`)}
                className="flex-1"
              />
              <Input placeholder="Alt text" {...register(`images.${index}.altText`)} className="flex-1" />
              <Button type="button" variant="ghost" onClick={() => imageFields.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <p className="font-semibold text-ink-900">Variants</p>
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
            <div
              key={field.id}
              className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-5"
            >
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
