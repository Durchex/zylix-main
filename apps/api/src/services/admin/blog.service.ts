import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import { sanitizeRichText } from "@/utils/sanitizeHtml";
import type {
  AdminBlogListQuery,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "@/validation/admin/blog.schema";

export const adminBlogService = {
  async list(query: AdminBlogListQuery) {
    const where: Prisma.BlogPostWhereInput = {};
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { author: { select: { firstName: true, lastName: true } } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return paginate(items, total, query);
  },

  async getById(id: string) {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      throw new ApiError(404, "Post not found");
    }
    return post;
  },

  async create(authorId: string, input: CreateBlogPostInput) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new ApiError(409, "A post with this slug already exists");
    }

    return prisma.blogPost.create({
      data: {
        ...input,
        contentHtml: sanitizeRichText(input.contentHtml),
        authorId,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      },
    });
  },

  async update(id: string, input: UpdateBlogPostInput) {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Post not found");
    }
    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await prisma.blogPost.findUnique({ where: { slug: input.slug } });
      if (slugTaken) throw new ApiError(409, "A post with this slug already exists");
    }

    const becomingPublished = input.status === "PUBLISHED" && existing.status !== "PUBLISHED";

    return prisma.blogPost.update({
      where: { id },
      data: {
        ...input,
        ...(input.contentHtml ? { contentHtml: sanitizeRichText(input.contentHtml) } : {}),
        ...(becomingPublished ? { publishedAt: new Date() } : {}),
      },
    });
  },

  async delete(id: string) {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Post not found");
    }
    await prisma.blogPost.delete({ where: { id } });
  },
};
