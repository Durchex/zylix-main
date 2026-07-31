import { z } from "zod";

export const createShippingZoneSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    states: z.array(z.string().trim().min(1)).min(1, "Add at least one state"),
    fee: z.number().nonnegative(),
    freeShippingThreshold: z.number().nonnegative().nullable().optional(),
    estimatedDaysMin: z.number().int().positive(),
    estimatedDaysMax: z.number().int().positive(),
    isDefault: z.boolean().default(false),
  })
  .refine((data) => data.estimatedDaysMax >= data.estimatedDaysMin, {
    message: "Max delivery days must be greater than or equal to min delivery days",
    path: ["estimatedDaysMax"],
  });
export type CreateShippingZoneInput = z.infer<typeof createShippingZoneSchema>;

export const updateShippingZoneSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    states: z.array(z.string().trim().min(1)).min(1).optional(),
    fee: z.number().nonnegative().optional(),
    freeShippingThreshold: z.number().nonnegative().nullable().optional(),
    estimatedDaysMin: z.number().int().positive().optional(),
    estimatedDaysMax: z.number().int().positive().optional(),
    isDefault: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.estimatedDaysMin === undefined ||
      data.estimatedDaysMax === undefined ||
      data.estimatedDaysMax >= data.estimatedDaysMin,
    {
      message: "Max delivery days must be greater than or equal to min delivery days",
      path: ["estimatedDaysMax"],
    },
  );
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
