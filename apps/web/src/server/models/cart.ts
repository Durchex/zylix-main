import "server-only";
import { Schema, type Types } from "mongoose";
import { baseSchemaOptions, defineModel, ref, requiredMoney } from "./base";

export interface CartDoc {
  _id: Types.ObjectId;
  userId?: Types.ObjectId | null;
  sessionId?: string | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<CartDoc>(
  {
    userId: ref("User", { default: null, unique: true, sparse: true }),
    // For guest carts. Sparse for the same reason as userId — Mongo treats
    // every absent value as one null and would reject the second guest cart.
    sessionId: { type: String, default: null, unique: true, sparse: true },
    currency: { type: String, default: "NGN" },
  },
  { ...baseSchemaOptions, timestamps: true },
);

export const Cart = defineModel<CartDoc>("Cart", cartSchema);

export interface CartItemDoc {
  _id: Types.ObjectId;
  cartId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId | null;
  quantity: number;
  priceAtAdd: number;
  addedAt: Date;
}

const cartItemSchema = new Schema<CartItemDoc>(
  {
    cartId: ref("Cart", { required: true, index: true }),
    productId: ref("Product", { required: true }),
    variantId: ref("ProductVariant", { default: null }),
    quantity: { type: Number, default: 1, min: 1 },
    priceAtAdd: requiredMoney,
    addedAt: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

// Prisma's @@unique([cartId, productId, variantId]). A null variantId
// participates in the key here exactly as it did in Postgres: the same
// product with no variant can only appear once per cart.
cartItemSchema.index({ cartId: 1, productId: 1, variantId: 1 }, { unique: true });

export const CartItem = defineModel<CartItemDoc>("CartItem", cartItemSchema);

export interface WishlistDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<WishlistDoc>(
  { userId: ref("User", { required: true, unique: true }) },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const Wishlist = defineModel<WishlistDoc>("Wishlist", wishlistSchema);

export interface WishlistItemDoc {
  _id: Types.ObjectId;
  wishlistId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId | null;
  addedAt: Date;
}

const wishlistItemSchema = new Schema<WishlistItemDoc>(
  {
    wishlistId: ref("Wishlist", { required: true, index: true }),
    productId: ref("Product", { required: true }),
    variantId: ref("ProductVariant", { default: null }),
    addedAt: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

wishlistItemSchema.index({ wishlistId: 1, productId: 1, variantId: 1 }, { unique: true });

export const WishlistItem = defineModel<WishlistItemDoc>("WishlistItem", wishlistItemSchema);

export interface CompareItemDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId | null;
  addedAt: Date;
}

const compareItemSchema = new Schema<CompareItemDoc>(
  {
    userId: ref("User", { required: true, index: true }),
    productId: ref("Product", { required: true }),
    variantId: ref("ProductVariant", { default: null }),
    addedAt: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

compareItemSchema.index({ userId: 1, productId: 1, variantId: 1 }, { unique: true });

export const CompareItem = defineModel<CompareItemDoc>("CompareItem", compareItemSchema);
