import { z } from "zod";

export const sellerOrderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type SellerOrderListQuery = z.infer<typeof sellerOrderListQuerySchema>;

export const updateFulfillmentSchema = z.object({
  fulfillmentStatus: z.enum(["UNFULFILLED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});
export type UpdateFulfillmentInput = z.infer<typeof updateFulfillmentSchema>;
