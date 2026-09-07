import { z } from "zod";

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).nullable().optional(),
  quantity: z.number().int().positive().max(50),
});

export const shippingAddressInputSchema = z.object({
  fullName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  line1: z.string().trim().min(1),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  country: z.string().trim().default("Nigeria"),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, "Cart is empty"),
  shippingAddress: shippingAddressInputSchema,
  paymentProvider: z.enum([
    "FLUTTERWAVE",
    "PAYSTACK",
    "STRIPE",
    "PAYPAL",
    "APPLE_PAY",
    "GOOGLE_PAY",
    "WALLET",
    "BANK_TRANSFER",
  ]),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderTrackingQuerySchema = z.object({
  orderNumber: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
});

export const myOrderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});
export type MyOrderListQuery = z.infer<typeof myOrderListQuerySchema>;
