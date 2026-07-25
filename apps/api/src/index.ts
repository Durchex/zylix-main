import { createApp } from "@/app";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Zylix API listening on port ${env.PORT} [${env.NODE_ENV}]`);
});

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
