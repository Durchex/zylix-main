import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import type { BlogListQuery } from "@/validation/blog.schema";

const summarySelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImageUrl: true,
  publishedAt: true,
  author: { select: { firstName: true, lastName: true } },
} as const;

export const blogService = {
  async list(query: BlogListQuery) {
    const where = { status: "PUBLISHED" as const, publishedAt: { lte: new Date() } };

    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: summarySelect,
        orderBy: { publishedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return paginate(items, total, query);
  },

  async getBySlug(slug: string) {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { ...summarySelect, contentHtml: true, seoTitle: true, seoDescription: true },
    });
    if (!post) {
      throw new ApiError(404, "Post not found");
    }
    return post;
  },
};
