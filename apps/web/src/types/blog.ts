export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string;
  author: { firstName: string; lastName: string };
}

export interface BlogPostDetail extends BlogPostSummary {
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
}
