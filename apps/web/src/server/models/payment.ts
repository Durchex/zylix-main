import "server-only";
import { Schema, type Types } from "mongoose";
import { baseSchemaOptions, defineModel, ref, requiredMoney } from "./base";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  type PaymentProvider,
  type PaymentStatus,
} from "./enums";

export interface PaymentDoc {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  provider: PaymentProvider;
  providerRef?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  rawResponse?: unknown;
  createdAt: Date;
}

const paymentSchema = new Schema<PaymentDoc>(
  {
    orderId: ref("Order", { required: true, index: true }),
    provider: { type: String, enum: PAYMENT_PROVIDERS, required: true, index: true },
    providerRef: { type: String, default: null },
    amount: requiredMoney,
    currency: { type: String, default: "NGN" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },
    // Prisma's Json? column — the provider's raw webhook/verify payload, kept
    // verbatim for dispute investigation. Mixed so Mongoose doesn't try to
    // impose a shape on a body whose schema is the provider's, not ours.
    rawResponse: { type: Schema.Types.Mixed, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const Payment = defineModel<PaymentDoc>("Payment", paymentSchema);

export interface SavedPaymentMethodDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  provider: PaymentProvider;
  providerToken: string;
  brand?: string | null;
  last4?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault: boolean;
  createdAt: Date;
}

const savedPaymentMethodSchema = new Schema<SavedPaymentMethodDoc>(
  {
    userId: ref("User", { required: true, index: true }),
    provider: { type: String, enum: PAYMENT_PROVIDERS, required: true },
    // Tokenized reference only, never raw card data.
    providerToken: { type: String, required: true },
    brand: { type: String, default: null },
    last4: { type: String, default: null },
    expiryMonth: { type: Number, default: null },
    expiryYear: { type: Number, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const SavedPaymentMethod = defineModel<SavedPaymentMethodDoc>(
  "SavedPaymentMethod",
  savedPaymentMethodSchema,
);
