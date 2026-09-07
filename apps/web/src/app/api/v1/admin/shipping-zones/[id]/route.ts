import { NextResponse } from "next/server";
import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminShippingService } from "@/server/services/admin/shipping.service";
import { updateShippingZoneSchema } from "@/server/validation/admin/shipping.schema";

export const PATCH = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  const input = updateShippingZoneSchema.parse(await readJson(req));
  const zone = await adminShippingService.update(params.id, input);
  return { zone };
});

export const DELETE = withRoute(async (req, { params }) => {
  requireRole(req, "ADMIN");
  await adminShippingService.delete(params.id);
  return new NextResponse(null, { status: 204 });
});
