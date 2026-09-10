import { withRoute } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminSettingsService } from "@/server/services/admin/settings.service";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const categories = await adminSettingsService.listShipbubbleCategories();
  return { categories };
});
