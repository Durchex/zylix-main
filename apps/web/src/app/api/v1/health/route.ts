import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/server/db/connect";

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

// Not wrapped in withRoute — a health check that itself depends on the DB
// connection succeeding shouldn't report a 500 just because Mongo is down;
// it needs to report "degraded" instead, so the connect attempt is its own
// try/catch below rather than withRoute's generic error path.
export async function GET() {
  const databaseResult = await withTimeout(
    connectToDatabase().then(() => mongoose.connection.db!.admin().ping()),
    CHECK_TIMEOUT_MS,
  )
    .then(() => "ok" as const)
    .catch(() => "error" as const);

  const checks = { database: databaseResult };
  const isHealthy = Object.values(checks).every((status) => status === "ok");

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      service: "zylix-web",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 },
  );
}
