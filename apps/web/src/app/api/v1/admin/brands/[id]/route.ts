import { NextResponse } from "next/server";
import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminBrandService } from "@/server/services/admin/brand.service";
import { updateBrandSchema } from "@/server/validation/admin/brand.schema";

export const PATCH = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const input = updateBrandSchema.parse(await readJson(req));
  const brand = await adminBrandService.update(params.id, input);
  return { brand };
});

export const DELETE = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  await adminBrandService.delete(params.id);
  return new NextResponse(null, { status: 204 });
});
