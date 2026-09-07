import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { apiRouter } from "@/routes";
import { webhookRouter } from "@/routes/webhook.routes";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";

/**
 * Origins allowed to make credentialed browser requests to the API.
 *
 * Kept as a list rather than a single string because a site is almost never
 * reachable at exactly one origin — the apex and "www." host are distinct
 * origins to CORS, and a custom domain usually coexists with the platform's
 * own *.vercel.app / *.onrender.com URL. When the site's domain changes and
 * only APP_URL is updated, every browser call from the other origin fails
 * the CORS check, which surfaces as "authentication stopped working" (the
 * refresh cookie can't be sent, so every request looks logged-out).
 *
 * Trailing slashes are stripped: the browser's Origin header never has one,
 * but APP_URL is often pasted with it.
 */
function allowedOrigins(): string[] {
  const raw = [env.APP_URL, ...(env.CORS_ORIGINS?.split(",") ?? [])];
  return [...new Set(raw.map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean))];
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  const origins = allowedOrigins();
  app.use(
    cors({
      // Requests with no Origin header (server-to-server, curl, health
      // checks) aren't subject to CORS at all, so they pass through.
      origin(origin, callback) {
        if (!origin || origins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // Webhook signature verification needs the exact raw request bytes, so
  // these routes are mounted with express.raw() *before* the global
  // express.json() below parses (and thereby discards) the original body.
  app.use("/api/v1/webhooks", express.raw({ type: "application/json", limit: "1mb" }), webhookRouter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
