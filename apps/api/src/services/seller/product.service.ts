import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import type {
  CreateSellerProductInput,
  SellerProductListQuery,
  UpdateSellerProductInput,
} from "@/validation/seller/product.schema";

const include = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: true,
  category: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.ProductInclude;

async function assertOwnership(productId: string, sellerId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  if (product.sellerId !== sellerId) {
    // 404, not 403 — don't reveal that a product with this ID exists under another seller.
    throw new ApiError(404, "Product not found");
  }
  return product;
}

export const sellerProductService = {
  async list(sellerId: string, query: SellerProductListQuery) {
    const where: Prisma.ProductWhereInput = { sellerId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return paginate(items, total, query);
  },

  async getById(sellerId: string, productId: string) {
    await assertOwnership(productId, sellerId);
    return prisma.product.findUnique({ where: { id: productId }, include });
  },

  async create(sellerId: string, input: CreateSellerProductInput) {
    const [existingSlug, existingSku] = await Promise.all([
      prisma.product.findUnique({ where: { slug: input.slug } }),
      prisma.product.findUnique({ where: { sku: input.sku } }),
    ]);
    if (existingSlug) throw new ApiError(409, "A product with this slug already exists");
    if (existingSku) throw new ApiError(409, "A product with this SKU already exists");

    const { images, variants, ...productFields } = input;

    return prisma.product.create({
      data: {
        ...productFields,
        sellerId,
        images: { create: images },
        variants: { create: variants },
      },
      include,
    });
  },

  async update(sellerId: string, productId: string, input: UpdateSellerProductInput) {
    const existing = await assertOwnership(productId, sellerId);

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await prisma.product.findUnique({ where: { slug: input.slug } });
      if (slugTaken) throw new ApiError(409, "A product with this slug already exists");
    }
    if (input.sku && input.sku !== existing.sku) {
      const skuTaken = await prisma.product.findUnique({ where: { sku: input.sku } });
      if (skuTaken) throw new ApiError(409, "A product with this SKU already exists");
    }

    const { images, variants, ...productFields } = input;

    return prisma.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId } });
      }
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId } });
      }

      return tx.product.update({
        where: { id: productId },
        data: {
          ...productFields,
          ...(images ? { images: { create: images } } : {}),
          ...(variants ? { variants: { create: variants } } : {}),
        },
        include,
      });
    });
  },

  async delete(sellerId: string, productId: string) {
    await assertOwnership(productId, sellerId);
    await prisma.product.delete({ where: { id: productId } });
  },
};
