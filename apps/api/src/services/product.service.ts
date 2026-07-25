import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate, type PaginatedResult } from "@/utils/pagination";
import type { ProductListQuery } from "@/validation/product.schema";

const summaryInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  category: { select: { id: true, slug: true, name: true } },
  // Just enough to know what "add to cart" from a grid card would add —
  // the default variant if one exists, else nothing (falls back to the
  // product's own basePrice/stockQuantity).
  variants: { orderBy: [{ isDefault: "desc" as const }, { id: "asc" as const }], take: 1 },
} satisfies Prisma.ProductInclude;

const detailInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  category: { select: { id: true, slug: true, name: true } },
  variants: true,
  seller: { select: { id: true, storeName: true, storeSlug: true } },
  attributeValues: {
    include: { attributeValue: { include: { attribute: true } } },
  },
} satisfies Prisma.ProductInclude;

type ProductWithSummaryRelations = Prisma.ProductGetPayload<{ include: typeof summaryInclude }>;
type ProductWithDetailRelations = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;

function toSummary(product: ProductWithSummaryRelations) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    basePrice: product.basePrice.toString(),
    compareAtPrice: product.compareAtPrice?.toString() ?? null,
    currency: product.currency,
    avgRating: product.avgRating.toString(),
    reviewCount: product.reviewCount,
    isFeatured: product.isFeatured,
    primaryImage: product.images[0]
      ? {
          id: product.images[0].id,
          url: product.images[0].url,
          altText: product.images[0].altText,
          sortOrder: product.images[0].sortOrder,
        }
      : null,
    category: product.category,
    stockQuantity: product.stockQuantity,
    defaultVariant: product.variants[0]
      ? {
          id: product.variants[0].id,
          price: product.variants[0].price.toString(),
          stockQuantity: product.variants[0].stockQuantity,
        }
      : null,
  };
}

function toDetail(product: ProductWithDetailRelations) {
  return {
    ...toSummary(product),
    description: product.description,
    sku: product.sku,
    // Only meaningful when variants is empty — see the schema comment on
    // Product.stockQuantity.
    stockQuantity: product.stockQuantity,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      sortOrder: img.sortOrder,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price.toString(),
      compareAtPrice: v.compareAtPrice?.toString() ?? null,
      stockQuantity: v.stockQuantity,
      isDefault: v.isDefault,
    })),
    attributes: product.attributeValues.map((pav) => ({
      attributeName: pav.attributeValue.attribute.name,
      value: pav.attributeValue.value,
    })),
    seller: product.seller,
  };
}

function buildOrderBy(sort: ProductListQuery["sort"]): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { basePrice: "asc" };
    case "price-desc":
      return { basePrice: "desc" };
    case "rating":
      return { avgRating: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export const productService = {
  async list(query: ProductListQuery): Promise<PaginatedResult<ReturnType<typeof toSummary>>> {
    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
    };

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.seller) {
      where.seller = { storeSlug: query.seller };
    }
    if (query.brand) {
      where.brand = { equals: query.brand, mode: "insensitive" };
    }
    if (query.featured) {
      where.isFeatured = true;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }
    if (query.ids) {
      where.id = { in: query.ids.split(",").map((id) => id.trim()).filter(Boolean) };
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: summaryInclude,
        orderBy: buildOrderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return paginate(items.map(toSummary), total, query);
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: detailInclude,
    });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return toDetail(product);
  },

  async getById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, status: "ACTIVE" },
      include: detailInclude,
    });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return toDetail(product);
  },
};
