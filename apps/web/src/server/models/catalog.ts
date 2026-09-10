import "server-only";
import { Schema, type Types } from "mongoose";
import { baseSchemaOptions, defineModel, money, ref, requiredMoney } from "./base";
import {
  ATTRIBUTE_TYPES,
  PRODUCT_STATUSES,
  REVIEW_STATUSES,
  type AttributeType,
  type ProductStatus,
  type ReviewStatus,
} from "./enums";

export interface CategoryDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId?: Types.ObjectId | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    // Self-referencing tree, same as Prisma's "CategoryTree" relation.
    parentId: ref("Category", { default: null, index: true }),
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
  },
  baseSchemaOptions,
);

export const Category = defineModel<CategoryDoc>("Category", categorySchema);

/**
 * Admin-managed manufacturer brands (Samsung, Hisense, ...). This is the list
 * the product form's Brand dropdown is populated from.
 *
 * Deliberately not referenced by Product: `Product.brand` stays a plain
 * string holding the chosen name. That keeps the public brand pages and the
 * `?brand=` product filter — both of which work off the name — unchanged, at
 * the cost of a rename here not cascading to products already saved.
 */
export interface BrandDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

const brandSchema = new Schema<BrandDoc>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    logoUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  baseSchemaOptions,
);

export const Brand = defineModel<BrandDoc>("Brand", brandSchema);

export interface AttributeDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  type: AttributeType;
  unit?: string | null;
  categoryId?: Types.ObjectId | null;
}

const attributeSchema = new Schema<AttributeDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: ATTRIBUTE_TYPES, default: "SELECT" },
    unit: { type: String, default: null },
    categoryId: ref("Category", { default: null, index: true }),
  },
  baseSchemaOptions,
);

export const Attribute = defineModel<AttributeDoc>("Attribute", attributeSchema);

export interface AttributeValueDoc {
  _id: Types.ObjectId;
  attributeId: Types.ObjectId;
  value: string;
}

const attributeValueSchema = new Schema<AttributeValueDoc>(
  {
    attributeId: ref("Attribute", { required: true }),
    value: { type: String, required: true },
  },
  baseSchemaOptions,
);

attributeValueSchema.index({ attributeId: 1, value: 1 }, { unique: true });

export const AttributeValue = defineModel<AttributeValueDoc>("AttributeValue", attributeValueSchema);

export interface ProductDoc {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  brand: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number | null;
  currency: string;
  sku: string;
  status: ProductStatus;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  weightKg?: number | null;
  // Parcel dimensions in cm, used to quote courier rates. Optional because
  // most of the catalog predates them — anything unmeasured falls back to the
  // default box size in StoreSetting.
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  stockQuantity: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDoc>(
  {
    categoryId: ref("Category", { required: true, index: true }),
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, required: true, index: true },
    description: { type: String, required: true },
    basePrice: requiredMoney,
    compareAtPrice: { type: Number, default: null },
    currency: { type: String, default: "NGN" },
    sku: { type: String, required: true, unique: true },
    status: { type: String, enum: PRODUCT_STATUSES, default: "DRAFT", index: true },
    isFeatured: { type: Boolean, default: false },
    avgRating: money,
    reviewCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    weightKg: { type: Number, default: null },
    lengthCm: { type: Number, default: null },
    widthCm: { type: Number, default: null },
    heightCm: { type: Number, default: null },
    // Stock for products with no variants — they sell at basePrice using this
    // count directly. A product WITH variants tracks stock per-variant
    // instead (see ProductVariant.stockQuantity); this field is unused then.
    stockQuantity: { type: Number, default: 0 },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
  },
  { ...baseSchemaOptions, timestamps: true },
);

export const Product = defineModel<ProductDoc>("Product", productSchema);

export interface ProductImageDoc {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  url: string;
  altText?: string | null;
  sortOrder: number;
}

const productImageSchema = new Schema<ProductImageDoc>(
  {
    productId: ref("Product", { required: true, index: true }),
    url: { type: String, required: true },
    altText: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
  },
  baseSchemaOptions,
);

export const ProductImage = defineModel<ProductImageDoc>("ProductImage", productImageSchema);

export interface ProductVariantDoc {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  isDefault: boolean;
}

const productVariantSchema = new Schema<ProductVariantDoc>(
  {
    productId: ref("Product", { required: true, index: true }),
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // e.g. "256GB / Titanium Black"
    price: requiredMoney,
    compareAtPrice: { type: Number, default: null },
    stockQuantity: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  baseSchemaOptions,
);

export const ProductVariant = defineModel<ProductVariantDoc>("ProductVariant", productVariantSchema);

export interface ProductAttributeValueDoc {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  attributeValueId: Types.ObjectId;
}

const productAttributeValueSchema = new Schema<ProductAttributeValueDoc>(
  {
    productId: ref("Product", { required: true }),
    attributeValueId: ref("AttributeValue", { required: true, index: true }),
  },
  baseSchemaOptions,
);

productAttributeValueSchema.index({ productId: 1, attributeValueId: 1 }, { unique: true });

export const ProductAttributeValue = defineModel<ProductAttributeValueDoc>(
  "ProductAttributeValue",
  productAttributeValueSchema,
);

export interface ReviewDoc {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  title?: string | null;
  body: string;
  images: string[];
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: Date;
}

const reviewSchema = new Schema<ReviewDoc>(
  {
    productId: ref("Product", { required: true, index: true }),
    userId: ref("User", { required: true, index: true }),
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: null },
    body: { type: String, required: true },
    images: { type: [String], default: [] },
    isVerifiedPurchase: { type: Boolean, default: false },
    status: { type: String, enum: REVIEW_STATUSES, default: "PENDING" },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

export const Review = defineModel<ReviewDoc>("Review", reviewSchema);
