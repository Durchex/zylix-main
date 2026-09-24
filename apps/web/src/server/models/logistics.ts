import "server-only";
import { Schema, type Types } from "mongoose";
import { baseSchemaOptions, defineModel } from "./base";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "./enums";

/**
 * Single-document store configuration, found by `key: "default"` rather than
 * by id so callers never have to know an id that doesn't exist yet.
 *
 * Holds what a courier quote needs but an order can't supply: where parcels
 * ship *from*, what size box to assume for products nobody has measured, and
 * which Shipbubble package category to declare.
 */
export interface StoreSettingDoc {
  _id: Types.ObjectId;
  key: string;

  // Pickup origin — the sender side of every rate request.
  pickupName?: string | null;
  pickupEmail?: string | null;
  pickupPhone?: string | null;
  pickupAddress?: string | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  /** Cached from Shipbubble's address validation; re-validated when the address changes. */
  pickupAddressCode?: number | null;

  /** Fallback parcel size in cm for products without their own dimensions. */
  defaultLengthCm: number;
  defaultWidthCm: number;
  defaultHeightCm: number;
  /** Fallback weight in kg for products without one. */
  defaultWeightKg: number;

  /** Shipbubble package category id (from GET /shipping/labels/categories). */
  shipbubbleCategoryId?: number | null;

  /**
   * Which payment methods checkout offers. Stored as the enabled list rather
   * than a flag per provider so adding a provider is one enum entry rather
   * than a schema migration.
   *
   * Being listed here is necessary but not sufficient — a method also needs
   * its credentials present before it can be offered (see
   * paymentSettingsService), so an admin can't switch on a gateway the
   * environment can't actually talk to.
   */
  enabledPaymentMethods: PaymentProvider[];

  // Shown to the customer after they place a bank-transfer order. Account
  // details are not secrets — they're published precisely so people can pay
  // into them — so unlike gateway API keys these belong in the database where
  // an admin can change them without a redeploy.
  bankTransferBankName?: string | null;
  bankTransferAccountName?: string | null;
  bankTransferAccountNumber?: string | null;
  bankTransferInstructions?: string | null;

  updatedAt: Date;
}

const storeSettingSchema = new Schema<StoreSettingDoc>(
  {
    key: { type: String, required: true, unique: true, default: "default" },

    pickupName: { type: String, default: null },
    pickupEmail: { type: String, default: null },
    pickupPhone: { type: String, default: null },
    pickupAddress: { type: String, default: null },
    pickupLatitude: { type: Number, default: null },
    pickupLongitude: { type: Number, default: null },
    pickupAddressCode: { type: Number, default: null },

    defaultLengthCm: { type: Number, default: 30 },
    defaultWidthCm: { type: Number, default: 30 },
    defaultHeightCm: { type: Number, default: 30 },
    defaultWeightKg: { type: Number, default: 1 },

    shipbubbleCategoryId: { type: Number, default: null },

    // Every provider on by default — a fresh install should be able to take
    // money through whatever it has credentials for, not silently refuse
    // everything until someone finds this setting.
    enabledPaymentMethods: {
      type: [String],
      enum: PAYMENT_PROVIDERS,
      default: () => [...PAYMENT_PROVIDERS],
    },

    bankTransferBankName: { type: String, default: null },
    bankTransferAccountName: { type: String, default: null },
    bankTransferAccountNumber: { type: String, default: null },
    bankTransferInstructions: { type: String, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: false, updatedAt: true } },
);

export const StoreSetting = defineModel<StoreSettingDoc>("StoreSetting", storeSettingSchema);

/**
 * A courier quote returned by Shipbubble, kept server-side.
 *
 * The browser only ever sends back which courier was chosen — never its
 * price. The fee charged is looked up here by (requestToken, courierId,
 * serviceCode), so a tampered client can't talk the order into a cheaper
 * delivery than the courier actually quoted.
 *
 * Shipbubble's request tokens expire after 7 days; the TTL index below drops
 * these at the same point rather than letting them accumulate forever.
 */
export interface ShippingRateQuoteDoc {
  _id: Types.ObjectId;
  requestToken: string;
  userId?: Types.ObjectId | null;
  couriers: Array<{
    courierId: string;
    courierName: string;
    serviceCode: string;
    total: number;
    currency: string;
    deliveryEta?: string | null;
    pickupEta?: string | null;
  }>;
  createdAt: Date;
  expiresAt: Date;
}

const shippingRateQuoteSchema = new Schema<ShippingRateQuoteDoc>(
  {
    requestToken: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    couriers: {
      type: [
        new Schema(
          {
            courierId: { type: String, required: true },
            courierName: { type: String, required: true },
            serviceCode: { type: String, required: true },
            total: { type: Number, required: true },
            currency: { type: String, default: "NGN" },
            deliveryEta: { type: String, default: null },
            pickupEta: { type: String, default: null },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    expiresAt: { type: Date, required: true },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

shippingRateQuoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ShippingRateQuote = defineModel<ShippingRateQuoteDoc>(
  "ShippingRateQuote",
  shippingRateQuoteSchema,
);
