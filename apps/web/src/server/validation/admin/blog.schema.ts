import { z } from "zod";

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated"),
  excerpt: z.string().trim().max(300).optional(),
  contentHtml: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(300).optional(),
});
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = createBlogPostSchema.partial();
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

export const adminBlogListQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type AdminBlogListQuery = z.infer<typeof adminBlogListQuerySchema>;
