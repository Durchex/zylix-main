import { NextResponse } from "next/server";
import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminBlogService } from "@/server/services/admin/blog.service";
import { updateBlogPostSchema } from "@/server/validation/admin/blog.schema";

export const GET = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const post = await adminBlogService.getById(params.id);
  return { post };
});

export const PATCH = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const input = updateBlogPostSchema.parse(await readJson(req));
  const post = await adminBlogService.update(params.id, input);
  return { post };
});

export const DELETE = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  await adminBlogService.delete(params.id);
  return new NextResponse(null, { status: 204 });
});
