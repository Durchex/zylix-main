import { z } from "zod";

export const adminUserListQuerySchema = z.object({
  role: z.enum(["CUSTOMER", "SELLER", "ADMIN"]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
