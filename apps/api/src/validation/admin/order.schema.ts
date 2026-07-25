import { z } from "zod";

export const adminOrderListQuerySchema = z.object({
  status: z
    .enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
    .optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  note: z.string().trim().max(500).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
