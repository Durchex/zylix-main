import "server-only";
import { Types, type FilterQuery } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { paginate, type PaginatedResult } from "@/server/lib/pagination";
import { containsInsensitive, equalsInsensitive } from "@/server/lib/query";
import {
  Attribute,
  AttributeValue,
  Category,
  Product,
  ProductAttributeValue,
  ProductImage,
  ProductVariant,
  type ProductDoc,
  type ProductImageDoc,
  type ProductVariantDoc,
} from "@/server/models";
import type { ProductListQuery } from "@/server/validation/product.schema";

interface CategoryRef {
  id: string;
  slug: string;
  name: string;
}

interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  basePrice: string;
  compareAtPrice: string | null;
  currency: string;
  avgRating: string;
  reviewCount: number;
  isFeatured: boolean;
  primaryImage: { id: string; url: string; altText: string | null; sortOrder: number } | null;
  category: CategoryRef | null;
  stockQuantity: number;
  defaultVariant: { id: string; price: string; stockQuantity: number } | null;
}

/**
 * Prisma serialized every Decimal column to JSON as a string, and the
 * frontend parses these fields with Number(). Keeping the string shape means
 * the storage change from Postgres NUMERIC to a BSON double is invisible to
 * every consumer of the API.
 */
function decimalString(value: number | null | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toSummary(
  product: ProductDoc,
  image: ProductImageDoc | null,
  category: CategoryRef | null,
  variant: ProductVariantDoc | null,
): ProductSummary {
  return {
    id: String(product._id),
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    basePrice: String(product.basePrice),
    compareAtPrice: decimalString(product.compareAtPrice),
    currency: product.currency,
    avgRating: String(product.avgRating),
    reviewCount: product.reviewCount,
    isFeatured: product.isFeatured,
    primaryImage: image
      ? {
          id: String(image._id),
          url: image.url,
          altText: image.altText ?? null,
          sortOrder: image.sortOrder,
        }
      : null,
    category,
    stockQuantity: product.stockQuantity,
    defaultVariant: variant
      ? {
          id: String(variant._id),
          price: String(variant.price),
          stockQuantity: variant.stockQuantity,
        }
      : null,
  };
}

function buildSort(sort: ProductListQuery["sort"]): Record<string, 1 | -1> {
  switch (sort) {
    case "price-asc":
      return { basePrice: 1 };
    case "price-desc":
      return { basePrice: -1 };
    case "rating":
      return { avgRating: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

/**
 * Loads the images, categories and default variants for a page of products in
 * three queries rather than three per product.
 *
 * Prisma's `include` did this join in the database; Mongo has no joins across
 * collections outside an aggregation pipeline, so the batched fetch replaces
 * it. Doing it naively (per product) would turn a 20-item grid into 61 round
 * trips, which on a serverless function with a per-request connection is the
 * difference between a fast page and a timeout.
 */
async function loadSummaryRelations(products: ProductDoc[]) {
  const productIds = products.map((p) => p._id);
  const categoryIds = [...new Set(products.map((p) => String(p.categoryId)))];

  const [images, categories, variants] = await Promise.all([
    ProductImage.find({ productId: { $in: productIds } })
      .sort({ sortOrder: 1 })
      .lean<ProductImageDoc[]>(),
    Category.find({ _id: { $in: categoryIds } })
      .select("_id slug name")
      .lean(),
    // Mirrors Prisma's `orderBy: [{ isDefault: desc }, { id: asc }], take: 1` —
    // the flagged default variant if there is one, else the oldest.
    ProductVariant.find({ productId: { $in: productIds } })
      .sort({ isDefault: -1, _id: 1 })
      .lean<ProductVariantDoc[]>(),
  ]);

  const firstImageByProduct = new Map<string, ProductImageDoc>();
  for (const image of images) {
    const key = String(image.productId);
    if (!firstImageByProduct.has(key)) firstImageByProduct.set(key, image);
  }

  const categoryById = new Map<string, CategoryRef>(
    categories.map((c) => [String(c._id), { id: String(c._id), slug: c.slug, name: c.name }]),
  );

  const firstVariantByProduct = new Map<string, ProductVariantDoc>();
  for (const variant of variants) {
    const key = String(variant.productId);
    if (!firstVariantByProduct.has(key)) firstVariantByProduct.set(key, variant);
  }

  return { firstImageByProduct, categoryById, firstVariantByProduct };
}

async function toDetail(product: ProductDoc) {
  const [images, category, variants, attributeLinks] = await Promise.all([
    ProductImage.find({ productId: product._id }).sort({ sortOrder: 1 }).lean<ProductImageDoc[]>(),
    Category.findById(product.categoryId).select("_id slug name").lean(),
    ProductVariant.find({ productId: product._id })
      .sort({ isDefault: -1, _id: 1 })
      .lean<ProductVariantDoc[]>(),
    ProductAttributeValue.find({ productId: product._id }).lean(),
  ]);

  // The attribute chain was `attributeValues -> attributeValue -> attribute`
  // in one Prisma include; here it's two further batched lookups.
  const attributeValues = await AttributeValue.find({
    _id: { $in: attributeLinks.map((link) => link.attributeValueId) },
  }).lean();
  const attributes = await Attribute.find({
    _id: { $in: [...new Set(attributeValues.map((v) => String(v.attributeId)))] },
  }).lean();
  const attributeById = new Map(attributes.map((a) => [String(a._id), a]));

  const categoryRef: CategoryRef | null = category
    ? { id: String(category._id), slug: category.slug, name: category.name }
    : null;

  return {
    ...toSummary(product, images[0] ?? null, categoryRef, variants[0] ?? null),
    description: product.description,
    sku: product.sku,
    // Only meaningful when variants is empty — see the schema comment on
    // Product.stockQuantity.
    stockQuantity: product.stockQuantity,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    images: images.map((img) => ({
      id: String(img._id),
      url: img.url,
      altText: img.altText ?? null,
      sortOrder: img.sortOrder,
    })),
    variants: variants.map((v) => ({
      id: String(v._id),
      sku: v.sku,
      name: v.name,
      price: String(v.price),
      compareAtPrice: decimalString(v.compareAtPrice),
      stockQuantity: v.stockQuantity,
      isDefault: v.isDefault,
    })),
    attributes: attributeValues.map((av) => ({
      attributeName: attributeById.get(String(av.attributeId))?.name ?? "",
      value: av.value,
    })),
  };
}

export const productService = {
  async list(query: ProductListQuery): Promise<PaginatedResult<ProductSummary>> {
    const filter: FilterQuery<ProductDoc> = { status: "ACTIVE" };

    // Prisma filtered on the related row directly (`category: { slug }`).
    // Mongo can't traverse a reference in a find(), so the slug is resolved to
    // an id first. A slug that matches nothing must yield an empty page rather
    // than an unfiltered one, hence the explicit impossible filter.
    if (query.category) {
      const category = await Category.findOne({ slug: query.category }).select("_id").lean();
      if (!category) return paginate([], 0, query);
      filter.categoryId = category._id;
    }

    if (query.brand) {
      // Comma-separated means "any of these" — the listing sidebar lets
      // several brands be checked at once. A single value still resolves to
      // the same case-insensitive exact match as before.
      const brands = query.brand
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      if (brands.length === 0) return paginate([], 0, query);
      filter.brand =
        brands.length === 1 ? equalsInsensitive(brands[0]!) : { $in: brands.map(equalsInsensitive) };
    }
    if (query.featured) {
      filter.isFeatured = true;
    }
    if (query.onSale) {
      // Comparing two fields of the same document needs $expr. A null
      // compareAtPrice sorts below any number here, so unmarked-down products
      // drop out without needing a separate null check.
      filter.$expr = { $gt: ["$compareAtPrice", "$basePrice"] };
    }
    // Availability and search each need their own $or, and a single filter
    // object can only hold one — so both go into $and, which composes.
    //
    // Typed as a plain record rather than FilterQuery<ProductDoc>[]: Mongoose's
    // FilterQuery is a deeply recursive conditional type, and an array of it
    // holding nested object literals made the whole server typecheck run out
    // of memory. The single cast where it's assigned below keeps the cost off
    // the hot path without changing what's sent to Mongo.
    const andClauses: Record<string, unknown>[] = [];

    if (query.availability) {
      // Stock lives on the variant when a product has variants and on the
      // product otherwise, so "in stock" is either-or rather than a single
      // field comparison.
      const inStockVariantProductIds = await ProductVariant.distinct("productId", {
        stockQuantity: { $gt: 0 },
      });
      andClauses.push(
        query.availability === "in"
          ? { $or: [{ stockQuantity: { $gt: 0 } }, { _id: { $in: inStockVariantProductIds } }] }
          : { stockQuantity: { $lte: 0 }, _id: { $nin: inStockVariantProductIds } },
      );
    }
    if (query.search) {
      const pattern = containsInsensitive(query.search);
      andClauses.push({ $or: [{ name: pattern }, { brand: pattern }, { description: pattern }] });
    }
    if (andClauses.length > 0) {
      filter.$and = andClauses as FilterQuery<ProductDoc>["$and"];
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.basePrice = {
        ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
      };
    }
    if (query.ids) {
      const ids = query.ids
        .split(",")
        .map((id) => id.trim())
        .filter((id) => Types.ObjectId.isValid(id));
      if (ids.length === 0) return paginate([], 0, query);
      filter._id = { $in: ids };
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(buildSort(query.sort))
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<ProductDoc[]>(),
      Product.countDocuments(filter),
    ]);

    const { firstImageByProduct, categoryById, firstVariantByProduct } =
      await loadSummaryRelations(items);

    const summaries = items.map((product) =>
      toSummary(
        product,
        firstImageByProduct.get(String(product._id)) ?? null,
        categoryById.get(String(product.categoryId)) ?? null,
        firstVariantByProduct.get(String(product._id)) ?? null,
      ),
    );

    return paginate(summaries, total, query);
  },

  async getBySlug(slug: string) {
    const product = await Product.findOne({ slug, status: "ACTIVE" }).lean<ProductDoc>();
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return toDetail(product);
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Product not found");
    }
    const product = await Product.findOne({ _id: id, status: "ACTIVE" }).lean<ProductDoc>();
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return toDetail(product);
  },
};

export type { ProductSummary };
