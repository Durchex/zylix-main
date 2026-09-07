import "server-only";
import { Schema, type Types } from "mongoose";
import { baseSchemaOptions, defineModel, ref } from "./base";
import {
  ADMIN_PERMISSIONS,
  ROLES,
  USER_STATUSES,
  type AdminPermission,
  type Role,
  type UserStatus,
} from "./enums";

export interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  phone?: string | null;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: Role;
  adminPermissions: AdminPermission[];
  status: UserStatus;
  avatarUrl?: string | null;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  backupCodes: string[];
  emailVerificationTokenHash?: string | null;
  emailVerificationExpiresAt?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
  preferredCurrency: string;
  preferredLocale: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // `sparse` matters here in a way it didn't under Postgres: Mongo's unique
    // index counts every missing value as a single null, so without it the
    // second user who never supplies a phone number collides with the first.
    phone: { type: String, unique: true, sparse: true, default: null },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "CUSTOMER", index: true },
    adminPermissions: { type: [String], enum: ADMIN_PERMISSIONS, default: [] },
    status: { type: String, enum: USER_STATUSES, default: "PENDING_VERIFICATION" },
    avatarUrl: { type: String, default: null },
    emailVerifiedAt: { type: Date, default: null },
    phoneVerifiedAt: { type: Date, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },
    backupCodes: { type: [String], default: [] },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpiresAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
    preferredCurrency: { type: String, default: "NGN" },
    preferredLocale: { type: String, default: "en" },
  },
  { ...baseSchemaOptions, timestamps: true },
);

export const User = defineModel<UserDoc>("User", userSchema);

export interface RefreshTokenDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: ref("User", { required: true, index: true }),
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { ...baseSchemaOptions, timestamps: { createdAt: true, updatedAt: false } },
);

// Postgres kept revoked/expired rows until something pruned them. A TTL index
// lets Mongo drop each token once it's past its own expiry, so the collection
// stays bounded without a cron job. Revocation is still checked in code —
// this only reclaims rows that can no longer authenticate anything.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = defineModel<RefreshTokenDoc>("RefreshToken", refreshTokenSchema);
