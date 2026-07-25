import { z } from "zod";

export const adminSellerListQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "REJECTED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type AdminSellerListQuery = z.infer<typeof adminSellerListQuerySchema>;

export const rejectSellerSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});
