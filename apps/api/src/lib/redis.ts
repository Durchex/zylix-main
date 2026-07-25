import Redis from "ioredis";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err) => {
  logger.error("Redis connection error", { error: err.message });
});
