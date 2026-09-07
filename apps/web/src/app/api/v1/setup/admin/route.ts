import { timingSafeEqual } from "crypto";
import { withRoute, readJson } from "@/server/http/route";
import { ApiError } from "@/server/http/errors";
import { getEnv } from "@/server/config/env";
import { hashPassword } from "@/server/lib/crypto";
import { User } from "@/server/models";

function isAuthorized(configuredSecret: string | undefined, providedSecret: string): boolean {
  if (!configuredSecret) return false;
  const configured = Buffer.from(configuredSecret);
  const provided = Buffer.from(providedSecret);
  if (configured.length !== provided.length) return false;
  return timingSafeEqual(configured, provided);
}

/**
 * One-time admin provisioning, for hosts where a shell/SSH one-off command
 * isn't available (this was originally written for Render's free plan;
 * Vercel's serverless functions have the same limitation). Guarded by
 * SETUP_SECRET — with no secret configured, this always rejects.
 *
 * POST with a JSON body rather than the old GET-with-`?secret=` query string:
 * a secret in a URL ends up in Vercel's request logs and browser history,
 * where a body does not.
 */
export const POST = withRoute(async (req) => {
  const env = getEnv();
  if (!env.SETUP_SECRET) {
    throw new ApiError(
      500,
      "SETUP_SECRET is not configured on the server. Set it as an env var, redeploy, then retry.",
    );
  }

  const body = (await readJson(req)) as {
    secret?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };

  if (!isAuthorized(env.SETUP_SECRET, body.secret ?? "")) {
    throw new ApiError(401, "Unauthorized. Retry with the correct SETUP_SECRET value.");
  }

  const email = body.email?.toLowerCase() ?? "";
  const password = body.password ?? "";
  const firstName = body.firstName ?? "Admin";
  const lastName = body.lastName ?? "User";

  if (!email || !password) {
    throw new ApiError(400, "email and password are required.");
  }
  if (password.length < 8) {
    throw new ApiError(400, "password must be at least 8 characters.");
  }

  const passwordHash = await hashPassword(password);

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: { passwordHash, role: "ADMIN", status: "ACTIVE", firstName, lastName },
      $setOnInsert: { emailVerifiedAt: new Date() },
    },
    { upsert: true, new: true },
  );

  return { success: true, message: `Admin user ready: ${user.email}`, userId: String(user._id) };
});
