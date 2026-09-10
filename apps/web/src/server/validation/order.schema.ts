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
  postalCode: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  // Supplied by Google Places. Carried through to Shipbubble, which treats
  // coordinates as authoritative over the address text.
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().trim().optional(),
  /** Whether to keep this in the customer's reusable address book. */
  saveToAddressBook: z.boolean().default(false),
});

/**
 * The courier the customer picked. Only identifiers travel — the price is
 * looked up server-side from the stored quote, so the browser can't name its
 * own delivery fee.
 */
export const courierSelectionSchema = z.object({
  requestToken: z.string().trim().min(1),
  courierId: z.string().trim().min(1),
  serviceCode: z.string().trim().min(1),
});

export const createOrderSchema = z
  .object({
    items: z.array(orderItemInputSchema).min(1, "Cart is empty"),
    // Either reuse a saved address by id, or supply a new one inline.
    addressId: z.string().trim().min(1).optional(),
    shippingAddress: shippingAddressInputSchema.optional(),
    shipping: courierSelectionSchema.optional(),
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
  })
  .refine((value) => Boolean(value.addressId || value.shippingAddress), {
    message: "A shipping address is required",
    path: ["shippingAddress"],
  });
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Body of POST /shipping/rates — the cart plus wherever it's going. */
export const shippingRatesSchema = z
  .object({
    items: z.array(orderItemInputSchema).min(1, "Cart is empty"),
    addressId: z.string().trim().min(1).optional(),
    shippingAddress: shippingAddressInputSchema.optional(),
  })
  .refine((value) => Boolean(value.addressId || value.shippingAddress), {
    message: "A shipping address is required",
    path: ["shippingAddress"],
  });
export type ShippingRatesInput = z.infer<typeof shippingRatesSchema>;

export const orderTrackingQuerySchema = z.object({
  orderNumber: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
});

export const myOrderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});
export type MyOrderListQuery = z.infer<typeof myOrderListQuerySchema>;
