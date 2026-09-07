import { withRoute } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { authService } from "@/server/services/auth.service";

export const POST = withRoute(async (req) => {
  const user = requireAuth(req);
  await authService.resendVerificationEmail(user.id);
  return { message: "Verification email sent if your address needs verifying." };
});
