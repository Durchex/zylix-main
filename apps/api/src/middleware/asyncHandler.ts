import type { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express 4 does not catch rejected promises from async handlers — an error
 * thrown inside one would hang the request instead of reaching errorHandler.
 * Wrap every async controller method with this before registering it.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
