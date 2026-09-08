import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  description: z.string().trim().max(500).optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
});
export type CreateBrandInput = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = createBrandSchema.partial();
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
