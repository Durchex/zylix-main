import "server-only";
import { Schema, type Types } from "mongoose";
import { baseSchemaOptions, defineModel, money, ref, requiredMoney } from "./base";
import {
  ADDRESS_TYPES,
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  type AddressType,
  type FulfillmentStatus,
  type OrderStatus,
} from "./enums";

export interface AddressDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  label?: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  type: AddressType;
  isDefault: boolean;
  createdAt: Date;
}

const addressSchema = new Schema<AddressDoc>(
  {
    userId: ref("User", { required: true, index: true }),
    label: { type: String, default: null },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "Nigeria" },
    postalCode: { type: String, default: null },
    type: { type: String, enum: ADDRESS_TYPES, default: "SHIPPING" },
    isDefault: { type: Boolean, default: false },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const Address = defineModel<AddressDoc>("Address", addressSchema);

export interface OrderDoc {
  _id: Types.ObjectId;
  orderNumber: string;
  userId?: Types.ObjectId | null;
  guestEmail?: string | null;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discountTotal: number;
  total: number;
  shippingAddressId?: Types.ObjectId | null;
  billingAddressId?: Types.ObjectId | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  shippedAt?: Date | null;
  placedAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<OrderDoc>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: ref("User", { default: null, index: true }),
    guestEmail: { type: String, default: null },
    status: { type: String, enum: ORDER_STATUSES, default: "PENDING", index: true },
    currency: { type: String, default: "NGN" },
    subtotal: requiredMoney,
    shippingFee: money,
    tax: money,
    discountTotal: money,
    total: requiredMoney,
    shippingAddressId: ref("Address", { default: null }),
    billingAddressId: ref("Address", { default: null }),
    trackingNumber: { type: String, default: null },
    carrier: { type: String, default: null },
    shippedAt: { type: Date, default: null },
    placedAt: { type: Date, default: Date.now },
  },
  // Prisma named the creation timestamp `placedAt` rather than `createdAt`,
  // and the frontend reads that name — so only `updatedAt` is managed here
  // and `placedAt` keeps its own default.
  { ...baseSchemaOptions, timestamps: { createdAt: false, updatedAt: true } },
);

export const Order = defineModel<OrderDoc>("Order", orderSchema);

/**
 * Admin-configurable delivery pricing, keyed off Address.state (free text,
 * not an enum — matching against `states` is done in application code, not a
 * foreign key). `isDefault` marks the fallback zone used when an address's
 * state doesn't match any zone's `states` list.
 */
export interface ShippingZoneDoc {
  _id: Types.ObjectId;
  name: string;
  states: string[];
  fee: number;
  freeShippingThreshold?: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shippingZoneSchema = new Schema<ShippingZoneDoc>(
  {
    name: { type: String, required: true },
    states: { type: [String], default: [] },
    fee: requiredMoney,
    freeShippingThreshold: { type: Number, default: null },
    estimatedDaysMin: { type: Number, required: true },
    estimatedDaysMax: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { ...baseSchemaOptions, timestamps: true },
);

export const ShippingZone = defineModel<ShippingZoneDoc>("ShippingZone", shippingZoneSchema);

export interface OrderItemDoc {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  fulfillmentStatus: FulfillmentStatus;
}

const orderItemSchema = new Schema<OrderItemDoc>(
  {
    orderId: ref("Order", { required: true, index: true }),
    productId: ref("Product", { required: true }),
    variantId: ref("ProductVariant", { default: null }),
    productNameSnapshot: { type: String, required: true },
    skuSnapshot: { type: String, required: true },
    unitPrice: requiredMoney,
    quantity: { type: Number, required: true },
    subtotal: requiredMoney,
    fulfillmentStatus: { type: String, enum: FULFILLMENT_STATUSES, default: "UNFULFILLED" },
  },
  baseSchemaOptions,
);

export const OrderItem = defineModel<OrderItemDoc>("OrderItem", orderItemSchema);

export interface OrderStatusHistoryDoc {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  status: OrderStatus;
  note?: string | null;
  changedBy?: string | null;
  createdAt: Date;
}

const orderStatusHistorySchema = new Schema<OrderStatusHistoryDoc>(
  {
    orderId: ref("Order", { required: true, index: true }),
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: null },
    changedBy: { type: String, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const OrderStatusHistory = defineModel<OrderStatusHistoryDoc>(
  "OrderStatusHistory",
  orderStatusHistorySchema,
);
