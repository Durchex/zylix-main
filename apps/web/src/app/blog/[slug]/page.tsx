import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CTABanner } from "@/components/sections/CTABanner";
import { ReviewList } from "@/components/sections/ReviewList";
import { serverApiRequest } from "@/lib/server-api";
import type { BlogPostDetail, BlogPostSummary } from "@/types/blog";
import type { PaginatedResult } from "@/types/product";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const SAMPLE_REVIEWS = [
  { name: "Bola A.", rating: 5, comment: "This guide helped me pick the right model — exactly what I needed." },
  { name: "Kelechi N.", rating: 4, comment: "Clear comparisons and good pricing context for the Nigerian market." },
];

async function getPost(slug: string) {
  const result = await serverApiRequest<{ post: BlogPostDetail }>(`/blog/${slug}`, {
    tags: [`blog:${slug}`],
  });
  return result?.post ?? null;
}

async function getRelatedPosts(excludeSlug: string) {
  const result = await serverApiRequest<PaginatedResult<BlogPostSummary>>("/blog?pageSize=4", {
    tags: ["blog"],
  });
  return (result?.items ?? []).filter((post) => post.slug !== excludeSlug).slice(0, 3);
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    openGraph: post.coverImageUrl ? { images: [post.coverImageUrl] } : undefined,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(slug);

  return (
    <Container className="max-w-3xl py-12">
      <Link href="/blog" className="text-sm font-medium text-brand-600 hover:underline dark:text-accent-400">
        ← Back to Blog
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">{post.title}</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        By {post.author.firstName} {post.author.lastName} ·{" "}
        {new Date(post.publishedAt).toLocaleDateString("en-NG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {post.coverImageUrl && (
        <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-neutral-50 dark:bg-surface-800">
          <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
        </div>
      )}

      {/* contentHtml is authored exclusively through the admin CMS editor (Milestone 9),
          which is responsible for sanitizing this HTML before it's persisted. */}
      <div
        className="prose prose-neutral mt-8 max-w-none text-neutral-700 dark:prose-invert dark:text-neutral-300"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      <CTABanner
        title="Shop the products in this guide"
        subtitle="Browse the full range of electronics mentioned in this article."
        cta={{ label: "Shop now", href: "/products" }}
      />

      <ReviewList title="Reader reviews" items={SAMPLE_REVIEWS} />

      <CTABanner
        title="Get weekly deals and tech guides"
        subtitle="Create a Zylix account to receive our newsletter straight to your inbox."
        cta={{ label: "Create an account", href: "/auth/register" }}
        tone="dark"
      />

      {relatedPosts.length > 0 && (
        <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-surface-800">
          <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">Related articles</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:shadow-elevated dark:border-surface-800 dark:bg-surface-900"
              >
                <div className="relative aspect-video bg-neutral-50 dark:bg-surface-800">
                  {related.coverImageUrl && (
                    <Image src={related.coverImageUrl} alt={related.title} fill className="object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-ink-900 group-hover:text-brand-600 dark:text-neutral-50 dark:group-hover:text-accent-400">
                    {related.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
