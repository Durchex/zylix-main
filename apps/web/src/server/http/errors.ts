import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import mongoose from "mongoose";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** MongoServerError code for a unique-index violation. */
const DUPLICATE_KEY = 11000;

function isDuplicateKeyError(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === DUPLICATE_KEY;
}

/**
 * Single translation point from a thrown error to a JSON response, matching
 * the response envelope the Express errorHandler produced (`{ error: {
 * message, details? } }`) so the frontend's ApiRequestError parsing is
 * unchanged. Applied by withRoute() — route handlers just throw.
 */
export function toErrorResponse(err: unknown, path: string): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { message: "Validation failed", issues: err.flatten().fieldErrors } },
      { status: 422 },
    );
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      console.error(`[api] ${err.message}`, { details: err.details, path });
    }
    return NextResponse.json(
      { error: { message: err.message, details: err.details } },
      { status: err.statusCode },
    );
  }

  // A unique index rejecting a write is a client error (the email/slug/SKU is
  // taken), not a 500 — Postgres surfaced these as Prisma's P2002 and the
  // services checked for conflicts up front, but the index is still the
  // authority under a race, and a bare 500 there would be misleading.
  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0];
    return NextResponse.json(
      { error: { message: field ? `That ${field} is already taken` : "That value is already taken" } },
      { status: 409 },
    );
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return NextResponse.json(
      { error: { message: "Validation failed", issues: err.errors } },
      { status: 422 },
    );
  }

  // A malformed id reaching a query is a bad request, not a server fault —
  // Postgres accepted any string as a cuid and simply found nothing, but
  // Mongo throws when a non-ObjectId string is cast.
  if (err instanceof mongoose.Error.CastError) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  console.error(`[api] ${message}`, { path });
  return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
}
