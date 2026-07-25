import type { Request, Response } from "express";
import { requireAuth, requireRole } from "@/middleware/auth";
import { signAccessToken } from "@/utils/jwt";
import { ApiError } from "@/middleware/errorHandler";

function buildReq(overrides: Partial<Request> = {}): Request {
  return { headers: {}, ...overrides } as Request;
}

describe("requireAuth", () => {
  it("throws 401 when no Authorization header is present", () => {
    const req = buildReq();
    const next = jest.fn();

    expect(() => requireAuth(req, {} as Response, next)).toThrow(ApiError);
    try {
      requireAuth(req, {} as Response, next);
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(401);
    }
  });

  it("throws 401 for a malformed token", () => {
    const req = buildReq({ headers: { authorization: "Bearer garbage" } });
    const next = jest.fn();

    expect(() => requireAuth(req, {} as Response, next)).toThrow(ApiError);
  });

  it("attaches req.user and calls next for a valid token", () => {
    const token = signAccessToken({ sub: "user_1", email: "ada@example.com", role: "CUSTOMER" });
    const req = buildReq({ headers: { authorization: `Bearer ${token}` } });
    const next = jest.fn();

    requireAuth(req, {} as Response, next);

    expect(req.user).toEqual({ id: "user_1", email: "ada@example.com", role: "CUSTOMER" });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("requireRole", () => {
  it("throws 401 when req.user is not set", () => {
    const req = buildReq();
    const next = jest.fn();
    const middleware = requireRole("ADMIN");

    expect(() => middleware(req, {} as Response, next)).toThrow(ApiError);
  });

  it("throws 403 when the user's role is not permitted", () => {
    const req = buildReq({ user: { id: "user_1", email: "a@b.com", role: "CUSTOMER" } });
    const next = jest.fn();
    const middleware = requireRole("ADMIN");

    expect(() => middleware(req, {} as Response, next)).toThrow(ApiError);
    try {
      middleware(req, {} as Response, next);
    } catch (err) {
      expect((err as ApiError).statusCode).toBe(403);
    }
  });

  it("calls next when the user's role is permitted", () => {
    const req = buildReq({ user: { id: "user_1", email: "a@b.com", role: "ADMIN" } });
    const next = jest.fn();
    const middleware = requireRole("ADMIN", "SELLER");

    middleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
