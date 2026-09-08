"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AdminBrand } from "@/types/admin";

const brandFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().optional(),
  logoUrl: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

/** Lowercase, hyphen-separated slug derived from the brand name. */
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BrandFormDialog({
  open,
  onClose,
  onSubmit,
  brand,
  submitError,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: BrandFormValues) => void;
  brand: AdminBrand | null;
  submitError: string | null;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BrandFormValues>({ resolver: zodResolver(brandFormSchema) });

  useEffect(() => {
    if (open) {
      reset(
        brand
          ? {
              name: brand.name,
              slug: brand.slug,
              description: brand.description ?? "",
              logoUrl: brand.logoUrl ?? "",
              isActive: brand.isActive,
            }
          : { name: "", slug: "", description: "", logoUrl: "", isActive: true },
      );
    }
  }, [open, brand, reset]);

  const nameValue = watch("name");

  return (
    <Dialog open={open} onClose={onClose} title={brand ? "Edit Brand" : "Add Brand"}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {submitError && <Alert variant="error">{submitError}</Alert>}

        <Input label="Name" error={errors.name?.message} {...register("name")} />

        <div>
          <Input label="Slug" error={errors.slug?.message} {...register("slug")} />
          {!brand && nameValue && (
            <button
              type="button"
              onClick={() => setValue("slug", slugify(nameValue), { shouldValidate: true })}
              className="mt-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              Use &ldquo;{slugify(nameValue)}&rdquo;
            </button>
          )}
        </div>

        <Textarea label="Description (optional)" rows={3} {...register("description")} />

        <ImageUploadField
          label="Logo (optional)"
          value={watch("logoUrl") ?? ""}
          onChange={(url) => setValue("logoUrl", url, { shouldValidate: true })}
        />
        {errors.logoUrl?.message && <p className="text-sm text-error">{errors.logoUrl.message}</p>}

        <Checkbox label="Active" {...register("isActive")} />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {brand ? "Save changes" : "Create brand"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
