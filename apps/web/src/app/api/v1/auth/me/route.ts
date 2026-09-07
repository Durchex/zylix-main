import { withRoute } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { authService } from "@/server/services/auth.service";

export const GET = withRoute(async (req) => {
  const caller = requireAuth(req);
  const user = await authService.getCurrentUser(caller.id);
  return { user };
});
