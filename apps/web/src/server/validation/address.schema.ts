import { z } from "zod";

export const addressInputSchema = z.object({
  label: z.string().trim().max(50).optional(),
  fullName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  line1: z.string().trim().min(1),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  country: z.string().trim().default("Nigeria"),
  postalCode: z.string().trim().optional(),
  type: z.enum(["SHIPPING", "BILLING"]).default("SHIPPING"),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const updateAddressSchema = addressInputSchema.partial();
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
