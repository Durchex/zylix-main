import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import type {
  AdminProductListQuery,
  CreateProductInput,
  UpdateProductInput,
} from "@/validation/admin/product.schema";

const adminInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: true,
  category: { select: { id: true, slug: true, name: true } },
  seller: { select: { id: true, storeName: true, storeSlug: true } },
} satisfies Prisma.ProductInclude;

export const adminProductService = {
  async list(query: AdminProductListQuery) {
    const where: Prisma.ProductWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: adminInclude,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return paginate(items, total, query);
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({ where: { id }, include: adminInclude });
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return product;
  },

  async create(input: CreateProductInput) {
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
        images: { create: images },
        variants: { create: variants },
      },
      include: adminInclude,
    });
  },

  /**
   * Creates products one at a time rather than in a single transaction so a
   * bad row (duplicate slug/SKU, etc.) doesn't roll back the ones that were
   * fine — the admin gets a per-row report and can fix just the failures.
   */
  async bulkCreate(products: CreateProductInput[]) {
    const succeeded: Awaited<ReturnType<typeof adminProductService.create>>[] = [];
    const failed: Array<{ index: number; name: string; error: string }> = [];

    for (const [index, input] of products.entries()) {
      try {
        const product = await adminProductService.create(input);
        succeeded.push(product);
      } catch (err) {
        failed.push({
          index,
          name: input.name,
          error: err instanceof ApiError ? err.message : "Something went wrong",
        });
      }
    }

    return { succeeded, failed };
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Product not found");
    }

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
        await tx.productImage.deleteMany({ where: { productId: id } });
      }
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...productFields,
          ...(images ? { images: { create: images } } : {}),
          ...(variants ? { variants: { create: variants } } : {}),
        },
        include: adminInclude,
      });
    });
  },

  async delete(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Product not found");
    }
    await prisma.product.delete({ where: { id } });
  },
};
