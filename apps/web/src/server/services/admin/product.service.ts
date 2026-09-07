import "server-only";
import mongoose, { Types } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { paginate } from "@/server/lib/pagination";
import { containsInsensitive } from "@/server/lib/query";
import {
  Category,
  Product,
  ProductImage,
  ProductVariant,
  type ProductDoc,
  type ProductImageDoc,
  type ProductVariantDoc,
} from "@/server/models";
import type {
  AdminProductListQuery,
  CreateProductInput,
  UpdateProductInput,
} from "@/server/validation/admin/product.schema";

async function toAdminDto(product: ProductDoc) {
  const [images, variants, category] = await Promise.all([
    ProductImage.find({ productId: product._id }).sort({ sortOrder: 1 }).lean<ProductImageDoc[]>(),
    ProductVariant.find({ productId: product._id }).lean<ProductVariantDoc[]>(),
    Category.findById(product.categoryId).select("_id slug name").lean(),
  ]);

  return {
    ...product,
    id: String(product._id),
    basePrice: String(product.basePrice),
    compareAtPrice: product.compareAtPrice !== null && product.compareAtPrice !== undefined ? String(product.compareAtPrice) : null,
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
      compareAtPrice: v.compareAtPrice !== null && v.compareAtPrice !== undefined ? String(v.compareAtPrice) : null,
      stockQuantity: v.stockQuantity,
      isDefault: v.isDefault,
    })),
    category: category ? { id: String(category._id), slug: category.slug, name: category.name } : null,
  };
}

export const adminProductService = {
  async list(query: AdminProductListQuery) {
    const filter: mongoose.FilterQuery<ProductDoc> = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      const pattern = containsInsensitive(query.search);
      filter.$or = [{ name: pattern }, { sku: pattern }, { brand: pattern }];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<ProductDoc[]>(),
      Product.countDocuments(filter),
    ]);

    const dtos = await Promise.all(items.map(toAdminDto));
    return paginate(dtos, total, query);
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Product not found");
    }
    const product = await Product.findById(id).lean<ProductDoc>();
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return toAdminDto(product);
  },

  async create(input: CreateProductInput) {
    const [existingSlug, existingSku] = await Promise.all([
      Product.findOne({ slug: input.slug }).lean(),
      Product.findOne({ sku: input.sku }).lean(),
    ]);
    if (existingSlug) throw new ApiError(409, "A product with this slug already exists");
    if (existingSku) throw new ApiError(409, "A product with this SKU already exists");

    const { images, variants, ...productFields } = input;

    const product = await Product.create(productFields);

    await Promise.all([
      images.length
        ? ProductImage.insertMany(images.map((img) => ({ ...img, productId: product._id })))
        : Promise.resolve(),
      variants.length
        ? ProductVariant.insertMany(variants.map((v) => ({ ...v, productId: product._id })))
        : Promise.resolve(),
    ]);

    return toAdminDto(product.toObject() as ProductDoc);
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
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Product not found");
    }
    const existing = await Product.findById(id).lean<ProductDoc>();
    if (!existing) {
      throw new ApiError(404, "Product not found");
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await Product.findOne({ slug: input.slug }).lean();
      if (slugTaken) throw new ApiError(409, "A product with this slug already exists");
    }
    if (input.sku && input.sku !== existing.sku) {
      const skuTaken = await Product.findOne({ sku: input.sku }).lean();
      if (skuTaken) throw new ApiError(409, "A product with this SKU already exists");
    }

    const { images, variants, ...productFields } = input;

    if (images) {
      await ProductImage.deleteMany({ productId: id });
      if (images.length) {
        await ProductImage.insertMany(images.map((img) => ({ ...img, productId: id })));
      }
    }
    if (variants) {
      await ProductVariant.deleteMany({ productId: id });
      if (variants.length) {
        await ProductVariant.insertMany(variants.map((v) => ({ ...v, productId: id })));
      }
    }

    const updated = await Product.findByIdAndUpdate(id, productFields, { new: true }).lean<ProductDoc>();
    return toAdminDto(updated as ProductDoc);
  },

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Product not found");
    }
    const existing = await Product.findById(id).lean();
    if (!existing) {
      throw new ApiError(404, "Product not found");
    }
    await Promise.all([
      Product.deleteOne({ _id: id }),
      ProductImage.deleteMany({ productId: id }),
      ProductVariant.deleteMany({ productId: id }),
    ]);
  },
};
