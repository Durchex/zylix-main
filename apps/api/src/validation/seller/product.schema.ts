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

export const createSellerProductSchema = z.object({
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
  images: z.array(productImageInput).default([]),
  variants: z.array(productVariantInput).default([]),
});
export type CreateSellerProductInput = z.infer<typeof createSellerProductSchema>;

export const updateSellerProductSchema = createSellerProductSchema.partial();
export type UpdateSellerProductInput = z.infer<typeof updateSellerProductSchema>;

export const sellerProductListQuerySchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type SellerProductListQuery = z.infer<typeof sellerProductListQuerySchema>;
