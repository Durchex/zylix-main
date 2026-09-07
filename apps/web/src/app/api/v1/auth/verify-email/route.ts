import { withRoute, readJson } from "@/server/http/route";
import { authService } from "@/server/services/auth.service";
import { verifyEmailSchema } from "@/server/validation/auth.schema";

export const POST = withRoute(async (req) => {
  const input = verifyEmailSchema.parse(await readJson(req));
  await authService.verifyEmail(input.token);
  return { message: "Email verified successfully." };
});
