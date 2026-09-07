import "server-only";

/**
 * Ports the Prisma schema's 20 enums. MongoDB has no native enum type, so
 * these are plain string unions enforced by Mongoose's `enum` validator, and
 * the const arrays double as the `enum` option and as Zod input validation.
 */
export const ROLES = ["CUSTOMER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "SUPPORT",
  "CATALOG_MANAGEMENT",
  "ORDER_MANAGEMENT",
  "PAYMENT_CONFIG",
  "FRAUD_REVIEW",
  "USER_MANAGEMENT",
  "ROLE_MANAGEMENT",
  "MARKETING",
  "CMS",
  "SEO",
  "ANALYTICS",
  "SUPER_ADMIN",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ATTRIBUTE_TYPES = ["SELECT", "NUMBER", "BOOLEAN", "TEXT"] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const ADDRESS_TYPES = ["SHIPPING", "BILLING"] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FULFILLMENT_STATUSES = [
  "UNFULFILLED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = [
  "FLUTTERWAVE",
  "PAYSTACK",
  "STRIPE",
  "PAYPAL",
  "APPLE_PAY",
  "GOOGLE_PAY",
  "WALLET",
  "BANK_TRANSFER",
] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const WALLET_TXN_TYPES = ["CREDIT", "DEBIT"] as const;
export type WalletTxnType = (typeof WALLET_TXN_TYPES)[number];

export const REWARD_TXN_TYPES = ["EARN", "REDEEM", "EXPIRE"] as const;
export type RewardTxnType = (typeof REWARD_TXN_TYPES)[number];

export const COUPON_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const BANNER_PLACEMENTS = [
  "HOME_HERO",
  "CATEGORY_TOP",
  "CHECKOUT_SIDEBAR",
  "BLOG_SIDEBAR",
] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const FRAUD_STATUSES = ["FLAGGED", "CLEARED", "CONFIRMED_FRAUD"] as const;
export type FraudStatus = (typeof FRAUD_STATUSES)[number];
