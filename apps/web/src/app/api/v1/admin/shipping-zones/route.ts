import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminShippingService } from "@/server/services/admin/shipping.service";
import { createShippingZoneSchema } from "@/server/validation/admin/shipping.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const zones = await adminShippingService.list();
  return { zones };
});

export const POST = withRoute(
  async (req) => {
    requireRole(req, "ADMIN");
    const input = createShippingZoneSchema.parse(await readJson(req));
    const zone = await adminShippingService.create(input);
    return { zone };
  },
  { status: 201 },
);
