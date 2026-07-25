import type { ProductImage } from "@/types/product";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type FulfillmentStatus = "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItemSummary {
  id: string;
  productId: string;
  variantId: string | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  fulfillmentStatus: FulfillmentStatus;
  product: {
    id: string;
    slug: string;
    name: string;
    images: ProductImage[];
  };
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  subtotal: string;
  shippingFee: string;
  tax: string;
  discountTotal: string;
  total: string;
  placedAt: string;
  items: OrderItemSummary[];
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface OrderAddress {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
}

export interface OrderPayment {
  id: string;
  provider: string;
  status: string;
  amount: string;
  currency: string;
}

export interface OrderDetail extends OrderSummary {
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  statusHistory: OrderStatusHistoryEntry[];
  payments: OrderPayment[];
}
