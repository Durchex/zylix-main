import { NextResponse } from "next/server";
import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminProductService } from "@/server/services/admin/product.service";
import { updateProductSchema } from "@/server/validation/admin/product.schema";

export const GET = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const product = await adminProductService.getById(params.id);
  return { product };
});

export const PATCH = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const input = updateProductSchema.parse(await readJson(req));
  const product = await adminProductService.update(params.id, input);
  return { product };
});

export const DELETE = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  await adminProductService.delete(params.id);
  return new NextResponse(null, { status: 204 });
});
