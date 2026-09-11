import { z } from "zod";

export const productListQuerySchema = z.object({
  category: z.string().trim().optional(),
  // Comma-separated so the listing sidebar can check several brands at once
  // (?brand=Hisense,TCL); a single value still works unchanged.
  brand: z.string().trim().optional(),
  search: z.string().trim().optional(),
  // "in" = only purchasable stock, "out" = only sold out. Omitted shows both.
  availability: z.enum(["in", "out"]).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
  featured: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  // Only products actually marked down — a compare-at price above what's
  // being charged. The /deals page was already passing this; until now the
  // schema didn't declare it, so Zod stripped it and the page silently
  // listed the entire catalogue as discounted.
  onSale: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  ids: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
