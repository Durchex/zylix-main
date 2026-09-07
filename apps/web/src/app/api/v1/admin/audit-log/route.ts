import { withRoute, readQuery } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { auditLogService } from "@/server/services/admin/auditLog.service";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const query = readQuery(req);
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return auditLogService.list({ page, pageSize });
});
