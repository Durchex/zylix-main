import crypto from "crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { ApiError } from "@/middleware/errorHandler";
import { hashPassword, verifyPassword } from "@/utils/password";
import { generateBearerToken, hashToken } from "@/utils/token";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/utils/jwt";
import { emailService } from "@/services/email.service";
import type { RegisterInput, LoginInput } from "@/validation/auth.schema";
import type { User } from "@prisma/client";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d, mirrors JWT_REFRESH_EXPIRES_IN default

export function sanitizeUser(user: User) {
  const {
    passwordHash: _passwordHash,
    twoFactorSecret: _twoFactorSecret,
    backupCodes: _backupCodes,
    emailVerificationTokenHash: _evth,
    passwordResetTokenHash: _prth,
    ...safe
  } = user;
  return safe;
}

async function issueSession(
  user: User,
  meta: { userAgent?: string; ipAddress?: string },
) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

  const tokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, tokenId });

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const { token, hash } = generateBearerToken();

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          passwordHash,
          emailVerificationTokenHash: hash,
          emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        },
      });

      await tx.cart.create({ data: { userId: created.id } });
      await tx.wishlist.create({ data: { userId: created.id } });
      await tx.wallet.create({ data: { userId: created.id } });
      await tx.referralCode.create({
        data: { userId: created.id, code: crypto.randomBytes(4).toString("hex") },
      });

      return created;
    });

    await emailService.sendVerificationEmail(user.email, token);

    return sanitizeUser(user);
  },

  async login(input: LoginInput, meta: { userAgent?: string; ipAddress?: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.status === "SUSPENDED" || user.status === "BANNED") {
      throw new ApiError(403, "This account is not active. Contact support for help.");
    }

    if (user.twoFactorEnabled) {
      if (!input.twoFactorCode) {
        return { requiresTwoFactor: true as const };
      }
      const validCode = authenticator.check(input.twoFactorCode, user.twoFactorSecret ?? "");
      if (!validCode) {
        throw new ApiError(401, "Invalid two-factor code");
      }
    }

    const { accessToken, refreshToken } = await issueSession(user, meta);

    return {
      requiresTwoFactor: false as const,
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async refreshSession(
    rawRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new ApiError(401, "Session expired, please log in again");
    }

    const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.tokenHash !== hashToken(rawRefreshToken)
    ) {
      throw new ApiError(401, "Session expired, please log in again");
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) {
      throw new ApiError(401, "Session expired, please log in again");
    }

    // Rotate: revoke the presented token and issue a fresh pair.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const { accessToken, refreshToken } = await issueSession(user, meta);

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  async logout(rawRefreshToken: string) {
    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { id: payload.tokenId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Already invalid/expired — logout is idempotent either way.
    }
  },

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return sanitizeUser(user);
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always behave the same way whether or not the account exists, to avoid
    // leaking which emails are registered.
    if (!user) return;

    const { token, hash } = generateBearerToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hash,
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    await emailService.sendPasswordResetEmail(user.email, token);
  },

  async resetPassword(token: string, newPassword: string) {
    const hash = hashToken(token);
    const user = await prisma.user.findFirst({
      where: { passwordResetTokenHash: hash, passwordResetExpiresAt: { gt: new Date() } },
    });
    if (!user) {
      throw new ApiError(400, "This reset link is invalid or has expired");
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    // Force re-login on every device after a password change.
    await authService.logoutAll(user.id);
  },

  async verifyEmail(token: string) {
    const hash = hashToken(token);
    const user = await prisma.user.findFirst({
      where: { emailVerificationTokenHash: hash, emailVerificationExpiresAt: { gt: new Date() } },
    });
    if (!user) {
      throw new ApiError(400, "This verification link is invalid or has expired");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        status: user.status === "PENDING_VERIFICATION" ? "ACTIVE" : user.status,
      },
    });
  },

  async resendVerificationEmail(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerifiedAt) return;

    const { token, hash } = generateBearerToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: hash,
        emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });

    await emailService.sendVerificationEmail(user.email, token);
  },

  async setupTwoFactor(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");
    if (user.twoFactorEnabled) {
      throw new ApiError(409, "Two-factor authentication is already enabled");
    }

    const secret = authenticator.generateSecret();
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });

    const otpauthUrl = authenticator.keyuri(user.email, env.TWO_FACTOR_ISSUER, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, qrCodeDataUrl };
  },

  async confirmTwoFactorSetup(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new ApiError(400, "Start two-factor setup first");
    }

    const valid = authenticator.check(code, user.twoFactorSecret);
    if (!valid) {
      throw new ApiError(401, "Invalid two-factor code");
    }

    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(5).toString("hex"),
    );
    const hashedBackupCodes = backupCodes.map(hashToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, backupCodes: hashedBackupCodes },
    });

    return { backupCodes };
  },

  async disableTwoFactor(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new ApiError(401, "Incorrect password");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: [] },
    });
  },
};
