import "server-only";
import { Schema, type Types } from "mongoose";
import { baseSchemaOptions, defineModel, money, ref, requiredMoney } from "./base";
import {
  COUPON_TYPES,
  REWARD_TXN_TYPES,
  WALLET_TXN_TYPES,
  type CouponType,
  type RewardTxnType,
  type WalletTxnType,
} from "./enums";

export interface WalletDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  balance: number;
  currency: string;
  updatedAt: Date;
}

const walletSchema = new Schema<WalletDoc>(
  {
    userId: ref("User", { required: true, unique: true }),
    balance: money,
    currency: { type: String, default: "NGN" },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: false, updatedAt: true } },
);

export const Wallet = defineModel<WalletDoc>("Wallet", walletSchema);

export interface WalletTransactionDoc {
  _id: Types.ObjectId;
  walletId: Types.ObjectId;
  type: WalletTxnType;
  amount: number;
  reason: string;
  referenceOrderId?: Types.ObjectId | null;
  createdAt: Date;
}

const walletTransactionSchema = new Schema<WalletTransactionDoc>(
  {
    walletId: ref("Wallet", { required: true, index: true }),
    type: { type: String, enum: WALLET_TXN_TYPES, required: true },
    amount: requiredMoney,
    reason: { type: String, required: true },
    referenceOrderId: ref("Order", { default: null }),
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const WalletTransaction = defineModel<WalletTransactionDoc>(
  "WalletTransaction",
  walletTransactionSchema,
);

export interface RewardPointsLedgerDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  points: number;
  type: RewardTxnType;
  sourceOrderId?: string | null;
  createdAt: Date;
}

const rewardPointsLedgerSchema = new Schema<RewardPointsLedgerDoc>(
  {
    userId: ref("User", { required: true, index: true }),
    points: { type: Number, required: true },
    type: { type: String, enum: REWARD_TXN_TYPES, required: true },
    sourceOrderId: { type: String, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const RewardPointsLedger = defineModel<RewardPointsLedgerDoc>(
  "RewardPointsLedger",
  rewardPointsLedgerSchema,
);

export interface CouponDoc {
  _id: Types.ObjectId;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  perUserLimit?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive: boolean;
  applicableCategoryIds: string[];
  applicableProductIds: string[];
  createdAt: Date;
}

const couponSchema = new Schema<CouponDoc>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: requiredMoney,
    minOrderAmount: { type: Number, default: null },
    maxDiscount: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: null },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    applicableCategoryIds: { type: [String], default: [] },
    applicableProductIds: { type: [String], default: [] },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const Coupon = defineModel<CouponDoc>("Coupon", couponSchema);

export interface CouponRedemptionDoc {
  _id: Types.ObjectId;
  couponId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  discountAmount: number;
  createdAt: Date;
}

const couponRedemptionSchema = new Schema<CouponRedemptionDoc>(
  {
    couponId: ref("Coupon", { required: true, index: true }),
    userId: ref("User", { required: true, index: true }),
    orderId: ref("Order", { required: true }),
    discountAmount: requiredMoney,
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const CouponRedemption = defineModel<CouponRedemptionDoc>(
  "CouponRedemption",
  couponRedemptionSchema,
);

export interface GiftCardDoc {
  _id: Types.ObjectId;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  issuedToEmail?: string | null;
  senderName?: string | null;
  message?: string | null;
  purchasedByUserId?: string | null;
  isActive: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
}

const giftCardSchema = new Schema<GiftCardDoc>(
  {
    code: { type: String, required: true, unique: true },
    initialBalance: requiredMoney,
    currentBalance: requiredMoney,
    currency: { type: String, default: "NGN" },
    issuedToEmail: { type: String, default: null },
    senderName: { type: String, default: null },
    message: { type: String, default: null },
    purchasedByUserId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const GiftCard = defineModel<GiftCardDoc>("GiftCard", giftCardSchema);

export interface GiftCardTransactionDoc {
  _id: Types.ObjectId;
  giftCardId: Types.ObjectId;
  amount: number;
  type: string; // ISSUE | REDEEM
  orderId?: Types.ObjectId | null;
  createdAt: Date;
}

const giftCardTransactionSchema = new Schema<GiftCardTransactionDoc>(
  {
    giftCardId: ref("GiftCard", { required: true, index: true }),
    amount: requiredMoney,
    type: { type: String, required: true },
    orderId: ref("Order", { default: null }),
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const GiftCardTransaction = defineModel<GiftCardTransactionDoc>(
  "GiftCardTransaction",
  giftCardTransactionSchema,
);

export interface ReferralCodeDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  code: string;
  createdAt: Date;
}

const referralCodeSchema = new Schema<ReferralCodeDoc>(
  {
    userId: ref("User", { required: true, unique: true }),
    code: { type: String, required: true, unique: true },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const ReferralCode = defineModel<ReferralCodeDoc>("ReferralCode", referralCodeSchema);

export interface ReferralDoc {
  _id: Types.ObjectId;
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  rewardIssued: boolean;
  status: string;
  createdAt: Date;
}

const referralSchema = new Schema<ReferralDoc>(
  {
    referrerId: ref("User", { required: true, index: true }),
    // Unique: an account can only ever be referred once.
    refereeId: ref("User", { required: true, unique: true }),
    rewardIssued: { type: Boolean, default: false },
    status: { type: String, default: "PENDING" },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const Referral = defineModel<ReferralDoc>("Referral", referralSchema);
