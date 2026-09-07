import "server-only";
import { Types, type FilterQuery } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { paginate } from "@/server/lib/pagination";
import { sanitizeRichText } from "@/server/lib/sanitizeHtml";
import { BlogPost, User, type BlogPostDoc } from "@/server/models";
import type {
  AdminBlogListQuery,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "@/server/validation/admin/blog.schema";

async function toDto(post: BlogPostDoc) {
  const author = await User.findById(post.authorId).select("firstName lastName").lean();
  return {
    ...post,
    id: String(post._id),
    author: author ? { firstName: author.firstName, lastName: author.lastName } : null,
  };
}

export const adminBlogService = {
  async list(query: AdminBlogListQuery) {
    const filter: FilterQuery<BlogPostDoc> = {};
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      BlogPost.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<BlogPostDoc[]>(),
      BlogPost.countDocuments(filter),
    ]);

    const dtos = await Promise.all(items.map(toDto));
    return paginate(dtos, total, query);
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Post not found");
    }
    const post = await BlogPost.findById(id).lean<BlogPostDoc>();
    if (!post) {
      throw new ApiError(404, "Post not found");
    }
    return post;
  },

  async create(authorId: string, input: CreateBlogPostInput) {
    const existing = await BlogPost.findOne({ slug: input.slug }).lean();
    if (existing) {
      throw new ApiError(409, "A post with this slug already exists");
    }

    const post = await BlogPost.create({
      ...input,
      contentHtml: sanitizeRichText(input.contentHtml),
      authorId,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    });

    return toDto(post.toObject() as BlogPostDoc);
  },

  async update(id: string, input: UpdateBlogPostInput) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Post not found");
    }
    const existing = await BlogPost.findById(id).lean<BlogPostDoc>();
    if (!existing) {
      throw new ApiError(404, "Post not found");
    }
    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await BlogPost.findOne({ slug: input.slug }).lean();
      if (slugTaken) throw new ApiError(409, "A post with this slug already exists");
    }

    const becomingPublished = input.status === "PUBLISHED" && existing.status !== "PUBLISHED";

    const updated = await BlogPost.findByIdAndUpdate(
      id,
      {
        ...input,
        ...(input.contentHtml ? { contentHtml: sanitizeRichText(input.contentHtml) } : {}),
        ...(becomingPublished ? { publishedAt: new Date() } : {}),
      },
      { new: true },
    ).lean<BlogPostDoc>();

    return toDto(updated as BlogPostDoc);
  },

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Post not found");
    }
    const existing = await BlogPost.findById(id).lean();
    if (!existing) {
      throw new ApiError(404, "Post not found");
    }
    await BlogPost.deleteOne({ _id: id });
  },
};
