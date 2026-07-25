"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody } from "@/components/ui/Card";
import { adminBlogApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";

const blogFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().trim().optional(),
  contentHtml: z.string().trim().min(1, "Content is required"),
  coverImageUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

export function BlogPostForm({ postId }: { postId?: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: { title: "", slug: "", excerpt: "", contentHtml: "", coverImageUrl: "", status: "DRAFT" },
  });

  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (postId) {
      adminBlogApi
        .getById(postId)
        .then((res) =>
          reset({
            title: res.post.title,
            slug: res.post.slug,
            excerpt: res.post.excerpt ?? "",
            contentHtml: res.post.contentHtml,
            coverImageUrl: res.post.coverImageUrl ?? "",
            status: res.post.status,
          }),
        )
        .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
    }
  }, [postId, reset, setLoadError]);

  async function onSubmit(values: BlogFormValues) {
    setSubmitError(null);
    try {
      const payload = { ...values, coverImageUrl: values.coverImageUrl || undefined };
      if (postId) {
        await adminBlogApi.update(postId, payload);
      } else {
        await adminBlogApi.create(payload);
      }
      router.push("/admin/cms/blog");
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {loadError && <Alert variant="error">{loadError}</Alert>}
      {submitError && <Alert variant="error">{submitError}</Alert>}

      <Card>
        <CardBody className="space-y-4">
          <Input label="Title" error={errors.title?.message} {...register("title")} />
          <Input label="Slug" error={errors.slug?.message} {...register("slug")} />
          <Textarea label="Excerpt (optional)" rows={2} {...register("excerpt")} />
          <Input label="Cover image URL (optional)" error={errors.coverImageUrl?.message} {...register("coverImageUrl")} />
          <Textarea
            label="Content (HTML)"
            rows={12}
            helperText="Written as HTML — sanitized server-side before publishing."
            error={errors.contentHtml?.message}
            {...register("contentHtml")}
          />
          <Select label="Status" {...register("status")}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </Select>
        </CardBody>
      </Card>

      <Button type="submit" isLoading={isSubmitting}>
        {postId ? "Save changes" : "Create post"}
      </Button>
    </form>
  );
}
