import { withRoute, readJson } from "@/server/http/route";
import { enforceRateLimit, passwordResetRateLimit } from "@/server/http/rateLimit";
import { authService } from "@/server/services/auth.service";
import { forgotPasswordSchema } from "@/server/validation/auth.schema";

export const POST = withRoute(async (req) => {
  await enforceRateLimit(req, passwordResetRateLimit);

  const input = forgotPasswordSchema.parse(await readJson(req));
  await authService.forgotPassword(input.email);

  // Always the same response whether or not the account exists.
  return { message: "If an account exists for that email, a reset link has been sent." };
});
