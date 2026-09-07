import { withRoute, readJson } from "@/server/http/route";
import { enforceRateLimit, passwordResetRateLimit } from "@/server/http/rateLimit";
import { authService } from "@/server/services/auth.service";
import { resetPasswordSchema } from "@/server/validation/auth.schema";

export const POST = withRoute(async (req) => {
  await enforceRateLimit(req, passwordResetRateLimit);

  const input = resetPasswordSchema.parse(await readJson(req));
  await authService.resetPassword(input.token, input.password);

  return { message: "Password reset successfully. Please log in." };
});
