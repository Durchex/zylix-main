import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/server/db/connect";
import { toErrorResponse } from "./errors";

/**
 * Next.js passes dynamic segments as a promise in the second argument of a
 * route handler. Params are always strings here (Next's own typing), and
 * every route in this API uses at most a couple of them.
 */
export interface RouteContext {
  params: Promise<Record<string, string>>;
}

export type RouteHandler = (
  req: NextRequest,
  ctx: { params: Record<string, string> },
) => Promise<NextResponse | unknown>;

/**
 * The replacement for Express's asyncHandler + errorHandler + the app-level
 * database connection. Every route handler is wrapped in this, so it can
 * `throw new ApiError(...)` and return a plain object instead of touching
 * status codes and try/catch itself.
 *
 * The connect() call is per-request rather than at module load because a
 * Vercel lambda can be recycled between requests — the cached connection in
 * db/connect.ts makes the warm-instance case a no-op.
 */
export function withRoute(handler: RouteHandler, options: { status?: number } = {}) {
  return async (req: NextRequest, ctx?: RouteContext): Promise<NextResponse> => {
    try {
      await connectToDatabase();
      const params = ctx?.params ? await ctx.params : {};
      const result = await handler(req, { params });

      if (result instanceof NextResponse) return result;
      if (result === undefined || result === null) {
        return new NextResponse(null, { status: 204 });
      }
      return NextResponse.json(result, { status: options.status ?? 200 });
    } catch (err) {
      return toErrorResponse(err, req.nextUrl.pathname);
    }
  };
}

/** Parses a JSON body, turning an absent or malformed one into `{}`. */
export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

/** Query string as a plain object, for the pagination/filter parsers. */
export function readQuery(req: NextRequest): Record<string, string> {
  return Object.fromEntries(req.nextUrl.searchParams.entries());
}

/**
 * The caller's IP, used to key rate limits and to record where a refresh
 * token was issued. Behind Vercel's proxy the socket address is the edge's,
 * so x-forwarded-for's first entry is the real client.
 */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
