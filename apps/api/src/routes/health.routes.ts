import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const healthRouter = Router();

const CHECK_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

healthRouter.get("/", async (_req, res) => {
  const [databaseResult, redisResult] = await Promise.allSettled([
    withTimeout(prisma.$queryRaw`SELECT 1`, CHECK_TIMEOUT_MS),
    withTimeout(redis.ping(), CHECK_TIMEOUT_MS),
  ]);

  const checks: Record<string, "ok" | "error"> = {
    database: databaseResult.status === "fulfilled" ? "ok" : "error",
    redis: redisResult.status === "fulfilled" ? "ok" : "error",
  };

  const isHealthy = Object.values(checks).every((status) => status === "ok");

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    service: "zylix-api",
    checks,
    timestamp: new Date().toISOString(),
  });
});
