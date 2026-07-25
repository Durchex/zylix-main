import { BlogPostForm } from "@/app/admin/cms/blog/BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Edit Blog Post</h1>
      <div className="mt-6 max-w-2xl">
        <BlogPostForm postId={id} />
      </div>
    </div>
  );
}
