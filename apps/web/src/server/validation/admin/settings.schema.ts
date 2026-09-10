import { z } from "zod";

export const updateStoreSettingsSchema = z.object({
  // Pickup origin. Sent to Shipbubble for validation whenever the address
  // changes, which is what produces the sender address code every rate
  // request needs.
  pickupName: z.string().trim().max(120).optional(),
  pickupEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  pickupPhone: z.string().trim().max(30).optional(),
  pickupAddress: z.string().trim().max(300).optional(),
  pickupLatitude: z.number().optional(),
  pickupLongitude: z.number().optional(),

  // Fallback parcel size for products with no dimensions of their own.
  defaultLengthCm: z.number().positive().max(500).optional(),
  defaultWidthCm: z.number().positive().max(500).optional(),
  defaultHeightCm: z.number().positive().max(500).optional(),
  defaultWeightKg: z.number().positive().max(1000).optional(),

  shipbubbleCategoryId: z.number().int().positive().optional(),
});
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
