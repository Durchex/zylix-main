import { Router } from "express";
import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const setupRouter = Router();

const SALT_ROUNDS = 10;

function isAuthorized(providedSecret: string): boolean {
  const configuredSecret = process.env.SETUP_SECRET;
  if (!configuredSecret) return false;

  const configured = Buffer.from(configuredSecret);
  const provided = Buffer.from(providedSecret);
  if (configured.length !== provided.length) return false;

  return timingSafeEqual(configured, provided);
}

// One-time admin provisioning over HTTP, for hosts (like Render's free
// plan) where the Shell/SSH one-off command feature isn't available.
// Guarded by SETUP_SECRET (set as an env var, never committed) — with no
// secret configured, this always rejects. Mirrors prisma/create-admin.ts.
setupRouter.get("/admin", async (req, res) => {
  if (!process.env.SETUP_SECRET) {
    return res.status(500).json({
      error: "SETUP_SECRET is not configured on the server. Set it as an env var, redeploy, then retry with ?secret=<that value>.",
    });
  }

  const secret = typeof req.query.secret === "string" ? req.query.secret : "";
  if (!isAuthorized(secret)) {
    return res.status(401).json({ error: "Unauthorized. Retry with ?secret=<your SETUP_SECRET value>." });
  }

  const email = typeof req.query.email === "string" ? req.query.email.toLowerCase() : "";
  const password = typeof req.query.password === "string" ? req.query.password : "";
  const firstName = typeof req.query.firstName === "string" ? req.query.firstName : "Admin";
  const lastName = typeof req.query.lastName === "string" ? req.query.lastName : "User";

  if (!email || !password) {
    return res.status(400).json({ error: "email and password query params are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters." });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", status: "ACTIVE", firstName, lastName },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  res.json({ success: true, message: `Admin user ready: ${user.email}`, userId: user.id });
});
