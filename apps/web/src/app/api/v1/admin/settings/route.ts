import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { adminSettingsService } from "@/server/services/admin/settings.service";
import { updateStoreSettingsSchema } from "@/server/validation/admin/settings.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  return adminSettingsService.get();
});

export const PATCH = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const input = updateStoreSettingsSchema.parse(await readJson(req));
  const settings = await adminSettingsService.update(input);
  return { settings };
});
