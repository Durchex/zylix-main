import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { serverApiRequest } from "@/lib/server-api";
import type { BlogPostDetail } from "@/types/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const result = await serverApiRequest<{ post: BlogPostDetail }>(`/blog/${slug}`, {
    tags: [`blog:${slug}`],
  });
  return result?.post ?? null;
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

  return (
    <Container className="max-w-3xl py-12">
      <Link href="/blog" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to Blog
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900">{post.title}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        By {post.author.firstName} {post.author.lastName} ·{" "}
        {new Date(post.publishedAt).toLocaleDateString("en-NG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {post.coverImageUrl && (
        <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-neutral-50">
          <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
        </div>
      )}

      {/* contentHtml is authored exclusively through the admin CMS editor (Milestone 9),
          which is responsible for sanitizing this HTML before it's persisted. */}
      <div
        className="prose prose-neutral mt-8 max-w-none text-neutral-700"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </Container>
  );
}
