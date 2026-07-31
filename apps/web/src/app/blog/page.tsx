import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { serverApiRequest } from "@/lib/server-api";
import type { BlogPostSummary } from "@/types/blog";
import type { PaginatedResult } from "@/types/product";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, product comparisons, and tech news from ZylixStore.",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPage() {
  const result = await serverApiRequest<PaginatedResult<BlogPostSummary>>(
    "/blog?pageSize=13",
    { tags: ["blog"] },
  );
  const posts = result?.items ?? [];
  const [featured, ...rest] = posts;

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">
        The ZylixStore Blog
      </h1>
      <p className="mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">
        Buying guides, comparisons, and the latest in consumer tech.
      </p>

      {posts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-surface-700">
          <p className="text-neutral-500">No articles published yet — check back soon.</p>
        </div>
      ) : (
        <>
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mt-10 grid gap-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:shadow-elevated dark:border-surface-800 dark:bg-surface-900 lg:grid-cols-2"
            >
              <div className="relative aspect-video bg-neutral-50 dark:bg-surface-800 lg:aspect-auto">
                {featured.coverImageUrl && (
                  <Image src={featured.coverImageUrl} alt={featured.title} fill className="object-cover" />
                )}
              </div>
              <div className="flex flex-col justify-center p-6 lg:p-8">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-accent-400">
                  Latest article
                </p>
                <h2 className="mt-2 text-2xl font-bold text-ink-900 group-hover:text-brand-600 dark:text-neutral-50">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-3 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {featured.excerpt}
                  </p>
                )}
                <p className="mt-4 text-xs text-neutral-400">{formatDate(featured.publishedAt)}</p>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:shadow-elevated dark:border-surface-800 dark:bg-surface-900"
                >
                  <div className="relative aspect-video bg-neutral-50 dark:bg-surface-800">
                    {post.coverImageUrl && (
                      <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-neutral-400">{formatDate(post.publishedAt)}</p>
                    <h2 className="mt-1 text-lg font-semibold text-ink-900 group-hover:text-brand-600 dark:text-neutral-50">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-14">
        <NewsletterSignup />
      </div>
    </Container>
  );
}
