import "server-only";
import mongoose from "mongoose";
import { getEnv } from "@/server/config/env";

/**
 * Serverless-safe Mongoose connection.
 *
 * On Vercel every request may land on a cold or recycled lambda, and each one
 * that opens its own connection burns an Atlas connection slot that nothing
 * closes. The promise (not just the connection) is cached on globalThis so
 * that concurrent requests inside one warm instance await a single in-flight
 * connect rather than racing to open several — caching only the resolved
 * connection would still let the first N concurrent requests each start one.
 *
 * `bufferCommands: false` makes a query issued before the connection is ready
 * fail immediately instead of queuing until Mongoose's buffer timeout, which
 * in a lambda means a request that hangs to the platform timeout with no
 * useful error.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.__mongoose ?? { conn: null, promise: null };
globalThis.__mongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const env = getEnv();
    mongoose.set("strictQuery", true);

    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB,
        bufferCommands: false,
        // Fail fast on a bad URI or an IP that isn't allow-listed in Atlas
        // rather than sitting at the default 30s, which on Vercel just
        // becomes an opaque function timeout.
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
      })
      .catch((err) => {
        // Clear the cached promise so the next request retries instead of
        // permanently re-awaiting a rejected connect for the life of the
        // lambda instance.
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
