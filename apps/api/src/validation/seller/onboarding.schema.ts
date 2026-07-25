import { z } from "zod";

export const sellerOnboardingSchema = z.object({
  storeName: z.string().trim().min(1).max(100),
  storeSlug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  description: z.string().trim().max(1000).optional(),
});
export type SellerOnboardingInput = z.infer<typeof sellerOnboardingSchema>;
