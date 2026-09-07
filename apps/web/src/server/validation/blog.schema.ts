import { z } from "zod";

export const blogListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type BlogListQuery = z.infer<typeof blogListQuerySchema>;
