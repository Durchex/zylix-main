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
import type { AdminCategory } from "@/types/admin";

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function CategoryFormDialog({
  open,
  onClose,
  onSubmit,
  category,
  submitError,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void;
  category: AdminCategory | null;
  submitError: string | null;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categoryFormSchema) });

  useEffect(() => {
    if (open) {
      reset(
        category
          ? {
              name: category.name,
              slug: category.slug,
              description: category.description ?? "",
              isActive: category.isActive,
            }
          : { name: "", slug: "", description: "", isActive: true },
      );
    }
  }, [open, category, reset]);

  return (
    <Dialog open={open} onClose={onClose} title={category ? "Edit Category" : "Add Category"}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {submitError && <Alert variant="error">{submitError}</Alert>}
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Slug" error={errors.slug?.message} {...register("slug")} />
        <Textarea label="Description (optional)" rows={3} {...register("description")} />
        <Checkbox label="Active" {...register("isActive")} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {category ? "Save changes" : "Create category"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
