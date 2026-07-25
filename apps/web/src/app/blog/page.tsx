import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { serverApiRequest } from "@/lib/server-api";
import type { BlogPostSummary } from "@/types/blog";
import type { PaginatedResult } from "@/types/product";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, product comparisons, and tech news from Zylix.",
};

export default async function BlogPage() {
  const result = await serverApiRequest<PaginatedResult<BlogPostSummary>>(
    "/blog?pageSize=12",
    { tags: ["blog"] },
  );
  const posts = result?.items ?? [];

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">The Zylix Blog</h1>
      <p className="mt-2 max-w-xl text-neutral-600">
        Buying guides, comparisons, and the latest in consumer tech.
      </p>

      {posts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-neutral-500">No articles published yet — check back soon.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:shadow-elevated"
            >
              <div className="relative aspect-video bg-neutral-50">
                {post.coverImageUrl && (
                  <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-neutral-400">
                  {new Date(post.publishedAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink-900 group-hover:text-brand-600">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{post.excerpt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
