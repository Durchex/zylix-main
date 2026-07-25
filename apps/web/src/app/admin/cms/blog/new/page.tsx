"use client";

import { BlogPostForm } from "@/app/admin/cms/blog/BlogPostForm";

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">New Blog Post</h1>
      <div className="mt-6 max-w-2xl">
        <BlogPostForm />
      </div>
    </div>
  );
}
