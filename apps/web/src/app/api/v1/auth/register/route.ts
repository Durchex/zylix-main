import { NextResponse } from "next/server";
import { withRoute, readJson } from "@/server/http/route";
import { enforceRateLimit, authRateLimit } from "@/server/http/rateLimit";
import { authService } from "@/server/services/auth.service";
import { registerSchema } from "@/server/validation/auth.schema";

export const POST = withRoute(async (req) => {
  await enforceRateLimit(req, authRateLimit);

  const input = registerSchema.parse(await readJson(req));
  const user = await authService.register(input);

  // Registration creates the account but does not sign the user in — the
  // email still needs verifying, same as the Express service.
  return NextResponse.json({ user }, { status: 201 });
});
