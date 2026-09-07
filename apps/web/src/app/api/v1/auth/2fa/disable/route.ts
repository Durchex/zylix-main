import { withRoute, readJson } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { ApiError } from "@/server/http/errors";
import { authService } from "@/server/services/auth.service";

export const POST = withRoute(async (req) => {
  const user = requireAuth(req);

  const { password } = (await readJson(req)) as { password?: string };
  if (!password) {
    throw new ApiError(422, "Password is required to disable two-factor authentication");
  }

  await authService.disableTwoFactor(user.id, password);
  return { message: "Two-factor authentication disabled." };
});
