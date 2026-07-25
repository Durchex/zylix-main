import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { logger } from "@/lib/logger";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        message: "Validation failed",
        issues: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be smaller than 5MB" : err.message;
    res.status(400).json({ error: { message } });
    return;
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { details: err.details, path: req.originalUrl });
    }
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error(message, { path: req.originalUrl });
  res.status(500).json({
    error: {
      message: "Internal server error",
    },
  });
}
