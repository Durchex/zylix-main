import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Accordion, type AccordionItemData } from "@/components/ui/Accordion";
import { CTABanner } from "@/components/sections/CTABanner";
import { serverApiRequest } from "@/lib/server-api";
import type { BlogPostSummary } from "@/types/blog";
import type { PaginatedResult } from "@/types/product";

export const metadata: Metadata = {
  title: "Blog",
  description: "Buying guides, product comparisons, and tech news from Zylix.",
};

const TOP_QUESTIONS: AccordionItemData[] = [
  { question: "Which refrigerator size do I need?", answer: "For a household of 1–2 people, 150–250L is typical; families of 4+ usually need 350L or more." },
  { question: "How do I choose between a laptop and a tablet?", answer: "Pick a laptop for heavier multitasking or productivity work, and a tablet for portability and media consumption." },
  { question: "What should I check before buying a smartwatch?", answer: "Battery life, compatibility with your phone's OS, and whether you need cellular connectivity or GPS." },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPage() {
  const result = await serverApiRequest<PaginatedResult<BlogPostSummary>>(
    "/blog?pageSize=12",
    { tags: ["blog"] },
  );
  const posts = result?.items ?? [];
  const [featured, ...rest] = posts;

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">The Zylix Blog</h1>
      <p className="mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">
        Buying guides, comparisons, and the latest in consumer tech.
      </p>

      {posts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-surface-700">
          <p className="text-neutral-500 dark:text-neutral-400">No articles published yet — check back soon.</p>
        </div>
      ) : (
        <>
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mt-10 grid overflow-hidden rounded-2xl border border-neutral-200 bg-white hover:shadow-elevated dark:border-surface-800 dark:bg-surface-900 sm:grid-cols-2"
            >
              <div className="relative aspect-video bg-neutral-50 dark:bg-surface-800 sm:aspect-auto">
                {featured.coverImageUrl && (
                  <Image src={featured.coverImageUrl} alt={featured.title} fill className="object-cover" />
                )}
              </div>
              <div className="flex flex-col justify-center p-6">
                <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatDate(featured.publishedAt)}</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink-900 group-hover:text-brand-600 dark:text-neutral-50 dark:group-hover:text-accent-400">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-3 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-400">{featured.excerpt}</p>
                )}
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
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatDate(post.publishedAt)}</p>
                    <h2 className="mt-1 text-lg font-semibold text-ink-900 group-hover:text-brand-600 dark:text-neutral-50 dark:group-hover:text-accent-400">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <section className="mt-12 border-t border-neutral-200 pt-8 dark:border-surface-800">
        <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">Top questions</h2>
        <Accordion items={TOP_QUESTIONS} />
      </section>

      <CTABanner
        title="Get weekly deals and tech guides"
        subtitle="Create a Zylix account to receive our newsletter straight to your inbox."
        cta={{ label: "Create an account", href: "/auth/register" }}
        tone="dark"
      />
    </Container>
  );
}
