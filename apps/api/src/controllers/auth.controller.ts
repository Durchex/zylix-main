import type { CookieOptions, Request, Response } from "express";
import { env } from "@/config/env";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/middleware/errorHandler";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  twoFactorVerifySchema,
} from "@/validation/auth.schema";

const REFRESH_COOKIE_NAME = "zylix_rt";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  // "none" is required for the frontend/API to authenticate across two
  // different domains (e.g. Netlify + Render) — browsers won't send a "lax"
  // cookie on a cross-site fetch. Only valid paired with secure:true, so
  // local dev (http://localhost, no TLS) stays on "lax" where frontend and
  // API are same-site anyway via the Next.js rewrite proxy.
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/v1/auth",
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

function requestMeta(req: Request) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };
}

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);
    res.status(201).json({ user });
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input, requestMeta(req));

    if (result.requiresTwoFactor) {
      res.status(200).json({ requiresTwoFactor: true });
      return;
    }

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  },

  async refresh(req: Request, res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken) {
      throw new ApiError(401, "Session expired, please log in again");
    }

    const result = await authService.refreshSession(rawRefreshToken, requestMeta(req));
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  },

  async logout(req: Request, res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawRefreshToken) {
      await authService.logout(rawRefreshToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
    res.status(204).send();
  },

  async logoutAll(req: Request, res: Response) {
    await authService.logoutAll(req.user!.id);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
    res.status(204).send();
  },

  async me(req: Request, res: Response) {
    const user = await authService.getCurrentUser(req.user!.id);
    res.status(200).json({ user });
  },

  async forgotPassword(req: Request, res: Response) {
    const input = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(input.email);
    res.status(200).json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  },

  async resetPassword(req: Request, res: Response) {
    const input = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input.token, input.password);
    res.status(200).json({ message: "Password reset successfully. Please log in." });
  },

  async verifyEmail(req: Request, res: Response) {
    const input = verifyEmailSchema.parse(req.body);
    await authService.verifyEmail(input.token);
    res.status(200).json({ message: "Email verified successfully." });
  },

  async resendVerificationEmail(req: Request, res: Response) {
    await authService.resendVerificationEmail(req.user!.id);
    res.status(200).json({ message: "Verification email sent if your address needs verifying." });
  },

  async setupTwoFactor(req: Request, res: Response) {
    const result = await authService.setupTwoFactor(req.user!.id);
    res.status(200).json(result);
  },

  async confirmTwoFactorSetup(req: Request, res: Response) {
    const input = twoFactorVerifySchema.parse(req.body);
    const result = await authService.confirmTwoFactorSetup(req.user!.id, input.code);
    res.status(200).json(result);
  },

  async disableTwoFactor(req: Request, res: Response) {
    const { password } = req.body as { password?: string };
    if (!password) {
      throw new ApiError(422, "Password is required to disable two-factor authentication");
    }
    await authService.disableTwoFactor(req.user!.id, password);
    res.status(200).json({ message: "Two-factor authentication disabled." });
  },
};
