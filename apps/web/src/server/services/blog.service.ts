import "server-only";
import { ApiError } from "@/server/http/errors";
import { paginate } from "@/server/lib/pagination";
import { BlogPost, User } from "@/server/models";
import type { BlogListQuery } from "@/server/validation/blog.schema";

interface AuthorRef {
  firstName: string;
  lastName: string;
}

function toSummary(
  post: { _id: unknown; slug: string; title: string; excerpt?: string | null; coverImageUrl?: string | null; publishedAt?: Date | null },
  author: AuthorRef | null,
) {
  return {
    id: String(post._id),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? null,
    coverImageUrl: post.coverImageUrl ?? null,
    publishedAt: post.publishedAt ?? null,
    author,
  };
}

export const blogService = {
  async list(query: BlogListQuery) {
    const filter = { status: "PUBLISHED" as const, publishedAt: { $lte: new Date() } };

    const [items, total] = await Promise.all([
      BlogPost.find(filter)
        .select("_id slug title excerpt coverImageUrl publishedAt authorId")
        .sort({ publishedAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      BlogPost.countDocuments(filter),
    ]);

    // One batched author lookup rather than Prisma's per-row `include`.
    const authors = await User.find({ _id: { $in: items.map((p) => p.authorId) } })
      .select("_id firstName lastName")
      .lean();
    const authorById = new Map(
      authors.map((a) => [String(a._id), { firstName: a.firstName, lastName: a.lastName }]),
    );

    const summaries = items.map((post) =>
      toSummary(post, authorById.get(String(post.authorId)) ?? null),
    );

    return paginate(summaries, total, query);
  },

  async getBySlug(slug: string) {
    const post = await BlogPost.findOne({ slug, status: "PUBLISHED" }).lean();
    if (!post) {
      throw new ApiError(404, "Post not found");
    }

    const author = await User.findById(post.authorId).select("firstName lastName").lean();

    return {
      ...toSummary(post, author ? { firstName: author.firstName, lastName: author.lastName } : null),
      contentHtml: post.contentHtml,
      seoTitle: post.seoTitle ?? null,
      seoDescription: post.seoDescription ?? null,
    };
  },
};
