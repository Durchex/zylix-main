import { withRoute, readJson } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { authService } from "@/server/services/auth.service";
import { twoFactorVerifySchema } from "@/server/validation/auth.schema";

export const POST = withRoute(async (req) => {
  const user = requireAuth(req);
  const input = twoFactorVerifySchema.parse(await readJson(req));
  return authService.confirmTwoFactorSetup(user.id, input.code);
});
