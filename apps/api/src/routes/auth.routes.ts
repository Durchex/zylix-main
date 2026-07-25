import { Router } from "express";
import { authController } from "@/controllers/auth.controller";
import { asyncHandler } from "@/middleware/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { authRateLimiter, passwordResetRateLimiter } from "@/middleware/rateLimiters";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, asyncHandler(authController.register));
authRouter.post("/login", authRateLimiter, asyncHandler(authController.login));
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.post("/logout-all", requireAuth, asyncHandler(authController.logoutAll));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));

authRouter.post(
  "/forgot-password",
  passwordResetRateLimiter,
  asyncHandler(authController.forgotPassword),
);
authRouter.post(
  "/reset-password",
  passwordResetRateLimiter,
  asyncHandler(authController.resetPassword),
);
authRouter.post("/verify-email", asyncHandler(authController.verifyEmail));
authRouter.post(
  "/resend-verification",
  requireAuth,
  asyncHandler(authController.resendVerificationEmail),
);

authRouter.post("/2fa/setup", requireAuth, asyncHandler(authController.setupTwoFactor));
authRouter.post("/2fa/confirm", requireAuth, asyncHandler(authController.confirmTwoFactorSetup));
authRouter.post("/2fa/disable", requireAuth, asyncHandler(authController.disableTwoFactor));
