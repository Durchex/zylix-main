import { withRoute } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminDashboardService } from "@/server/services/admin/dashboard.service";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  return adminDashboardService.getStats();
});
