import { z } from "zod";

export const productListQuerySchema = z.object({
  category: z.string().trim().optional(),
  seller: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  search: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
  featured: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  ids: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
