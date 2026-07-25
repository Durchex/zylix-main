"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminBlogApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminBlogPost } from "@/types/admin";

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState<AdminBlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    adminBlogApi
      .list()
      .then((res) => {
        setError(null);
        setPosts(res.items);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await adminBlogApi.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Blog Posts</h1>
        <Link href="/admin/cms/blog/new">
          <Button>New post</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!posts ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No posts yet.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{post.title}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {post.author.firstName} {post.author.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status === "PUBLISHED" ? "success" : "neutral"}>
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/cms/blog/${post.id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="text-sm font-medium text-error hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
