import { z } from "zod";

const productImageInput = z.object({
  url: z.string().url(),
  altText: z.string().trim().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});

const productVariantInput = z.object({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().nonnegative().default(0),
  isDefault: z.boolean().default(false),
});

export const createProductSchema = z.object({
  sellerId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  brand: z.string().trim().min(1),
  description: z.string().trim().min(1),
  basePrice: z.number().positive(),
  compareAtPrice: z.number().positive().nullable().optional(),
  currency: z.string().trim().default("NGN"),
  sku: z.string().trim().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  // Only meaningful when the product has no variants — used directly as the
  // purchasable stock count at basePrice. Ignored when variants exist (each
  // variant tracks its own stockQuantity instead).
  stockQuantity: z.number().int().nonnegative().default(0),
  weightKg: z.number().positive().nullable().optional(),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  images: z.array(productImageInput).default([]),
  variants: z.array(productVariantInput).default([]),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const bulkCreateProductSchema = z.object({
  products: z.array(createProductSchema).min(1, "Add at least one product").max(50, "Upload at most 50 products at a time"),
});
export type BulkCreateProductInput = z.infer<typeof bulkCreateProductSchema>;

export const adminProductListQuerySchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
