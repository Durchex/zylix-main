import "server-only";
import crypto from "crypto";
import { Types } from "mongoose";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { env } from "@/server/config/env";
import { ApiError } from "@/server/http/errors";
import { hashPassword, verifyPassword, generateBearerToken, hashToken } from "@/server/lib/crypto";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/server/lib/jwt";
import { emailService } from "@/server/lib/email";
import {
  Cart,
  RefreshToken,
  ReferralCode,
  User,
  Wallet,
  Wishlist,
  type UserDoc,
} from "@/server/models";
import type { RegisterInput, LoginInput } from "@/server/validation/auth.schema";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d, mirrors JWT_REFRESH_EXPIRES_IN default

type SessionMeta = { userAgent?: string; ipAddress?: string };

/**
 * Strips every credential-bearing field before a user document goes out over
 * the wire, and renames `_id` to the `id` the API contract already promised.
 */
export function sanitizeUser(user: UserDoc) {
  const {
    _id,
    passwordHash: _passwordHash,
    twoFactorSecret: _twoFactorSecret,
    backupCodes: _backupCodes,
    emailVerificationTokenHash: _evth,
    emailVerificationExpiresAt: _evea,
    passwordResetTokenHash: _prth,
    passwordResetExpiresAt: _prea,
    ...safe
  } = user;
  return { id: String(_id), ...safe };
}

async function issueSession(user: UserDoc, meta: SessionMeta) {
  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    role: user.role,
  });

  // The token's own id is minted here rather than left to Mongo, because the
  // refresh JWT has to embed the id it will later be looked up by, and its
  // hash — which depends on the signed token — is what gets stored.
  const tokenId = new Types.ObjectId();
  const refreshToken = signRefreshToken({ sub: String(user._id), tokenId: String(tokenId) });

  await RefreshToken.create({
    _id: tokenId,
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const { token, hash } = generateBearerToken();

    const user = await User.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      emailVerificationTokenHash: hash,
      emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    // Prisma ran the user and its four starter documents in one transaction.
    // Mongo transactions need a replica set, which a local single-node dev
    // instance isn't, so the same all-or-nothing guarantee is provided by
    // deleting the half-made account if any starter document fails — an
    // account without a cart or wallet would break checkout in ways that are
    // much harder to notice than a failed registration.
    try {
      await Promise.all([
        Cart.create({ userId: user._id }),
        Wishlist.create({ userId: user._id }),
        Wallet.create({ userId: user._id }),
        ReferralCode.create({ userId: user._id, code: crypto.randomBytes(4).toString("hex") }),
      ]);
    } catch (err) {
      await Promise.all([
        User.deleteOne({ _id: user._id }),
        Cart.deleteOne({ userId: user._id }),
        Wishlist.deleteOne({ userId: user._id }),
        Wallet.deleteOne({ userId: user._id }),
        ReferralCode.deleteOne({ userId: user._id }),
      ]).catch(() => undefined);
      throw err;
    }

    await emailService.sendVerificationEmail(user.email, token);

    return sanitizeUser(user.toObject() as UserDoc);
  },

  async login(input: LoginInput, meta: SessionMeta) {
    const user = await User.findOne({ email: input.email }).lean<UserDoc>();
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

  async refreshSession(rawRefreshToken: string, meta: SessionMeta) {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new ApiError(401, "Session expired, please log in again");
    }

    // A tokenId that isn't a valid ObjectId can only come from a forged or
    // pre-migration token; treat it as an expired session rather than letting
    // the cast throw.
    if (!Types.ObjectId.isValid(payload.tokenId)) {
      throw new ApiError(401, "Session expired, please log in again");
    }

    const stored = await RefreshToken.findById(payload.tokenId).lean();
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.tokenHash !== hashToken(rawRefreshToken)
    ) {
      throw new ApiError(401, "Session expired, please log in again");
    }

    const user = await User.findById(stored.userId).lean<UserDoc>();
    if (!user) {
      throw new ApiError(401, "Session expired, please log in again");
    }

    // Rotate: revoke the presented token and issue a fresh pair.
    await RefreshToken.updateOne({ _id: stored._id }, { revokedAt: new Date() });

    const { accessToken, refreshToken } = await issueSession(user, meta);

    return { user: sanitizeUser(user), accessToken, refreshToken };
  },

  async logout(rawRefreshToken: string) {
    try {
      const payload = verifyRefreshToken(rawRefreshToken);
      if (!Types.ObjectId.isValid(payload.tokenId)) return;
      await RefreshToken.updateOne(
        { _id: payload.tokenId, revokedAt: null },
        { revokedAt: new Date() },
      );
    } catch {
      // Already invalid/expired — logout is idempotent either way.
    }
  },

  async logoutAll(userId: string) {
    await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  },

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).lean<UserDoc>();
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return sanitizeUser(user);
  },

  async forgotPassword(email: string) {
    const user = await User.findOne({ email }).lean<UserDoc>();
    // Always behave the same way whether or not the account exists, to avoid
    // leaking which emails are registered.
    if (!user) return;

    const { token, hash } = generateBearerToken();
    await User.updateOne(
      { _id: user._id },
      {
        passwordResetTokenHash: hash,
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    );

    await emailService.sendPasswordResetEmail(user.email, token);
  },

  async resetPassword(token: string, newPassword: string) {
    const hash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: hash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).lean<UserDoc>();
    if (!user) {
      throw new ApiError(400, "This reset link is invalid or has expired");
    }

    const passwordHash = await hashPassword(newPassword);
    await User.updateOne(
      { _id: user._id },
      { passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null },
    );

    // Force re-login on every device after a password change.
    await authService.logoutAll(String(user._id));
  },

  async verifyEmail(token: string) {
    const hash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: hash,
      emailVerificationExpiresAt: { $gt: new Date() },
    }).lean<UserDoc>();
    if (!user) {
      throw new ApiError(400, "This verification link is invalid or has expired");
    }

    await User.updateOne(
      { _id: user._id },
      {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
        status: user.status === "PENDING_VERIFICATION" ? "ACTIVE" : user.status,
      },
    );
  },

  async resendVerificationEmail(userId: string) {
    const user = await User.findById(userId).lean<UserDoc>();
    if (!user || user.emailVerifiedAt) return;

    const { token, hash } = generateBearerToken();
    await User.updateOne(
      { _id: user._id },
      {
        emailVerificationTokenHash: hash,
        emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    );

    await emailService.sendVerificationEmail(user.email, token);
  },

  async setupTwoFactor(userId: string) {
    const user = await User.findById(userId).lean<UserDoc>();
    if (!user) throw new ApiError(404, "User not found");
    if (user.twoFactorEnabled) {
      throw new ApiError(409, "Two-factor authentication is already enabled");
    }

    const secret = authenticator.generateSecret();
    await User.updateOne({ _id: user._id }, { twoFactorSecret: secret });

    const otpauthUrl = authenticator.keyuri(user.email, env.TWO_FACTOR_ISSUER, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, qrCodeDataUrl };
  },

  async confirmTwoFactorSetup(userId: string, code: string) {
    const user = await User.findById(userId).lean<UserDoc>();
    if (!user?.twoFactorSecret) {
      throw new ApiError(400, "Start two-factor setup first");
    }

    const valid = authenticator.check(code, user.twoFactorSecret);
    if (!valid) {
      throw new ApiError(401, "Invalid two-factor code");
    }

    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString("hex"));
    const hashedBackupCodes = backupCodes.map(hashToken);

    await User.updateOne(
      { _id: user._id },
      { twoFactorEnabled: true, backupCodes: hashedBackupCodes },
    );

    return { backupCodes };
  },

  async disableTwoFactor(userId: string, password: string) {
    const user = await User.findById(userId).lean<UserDoc>();
    if (!user) throw new ApiError(404, "User not found");

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new ApiError(401, "Incorrect password");
    }

    await User.updateOne(
      { _id: user._id },
      { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: [] },
    );
  },
};
