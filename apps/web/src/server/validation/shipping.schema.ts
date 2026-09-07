import { z } from "zod";

export const shippingQuoteQuerySchema = z.object({
  state: z.string().trim().min(1),
  subtotal: z.coerce.number().nonnegative().default(0),
});
export type ShippingQuoteQuery = z.infer<typeof shippingQuoteQuerySchema>;
