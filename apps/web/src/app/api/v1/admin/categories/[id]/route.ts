import { NextResponse } from "next/server";
import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminCategoryService } from "@/server/services/admin/category.service";
import { updateCategorySchema } from "@/server/validation/admin/category.schema";

export const PATCH = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const input = updateCategorySchema.parse(await readJson(req));
  const category = await adminCategoryService.update(params.id, input);
  return { category };
});

export const DELETE = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  await adminCategoryService.delete(params.id);
  return new NextResponse(null, { status: 204 });
});
