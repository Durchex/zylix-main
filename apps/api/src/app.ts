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

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.APP_URL,
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
