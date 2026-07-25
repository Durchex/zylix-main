import { prisma } from "@/lib/prisma";
import { emailService } from "@/services/email.service";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    cart: { create: jest.fn() },
    wishlist: { create: jest.fn() },
    wallet: { create: jest.fn() },
    referralCode: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/services/email.service", () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    send: jest.fn(),
  },
}));

import { authService, sanitizeUser } from "@/services/auth.service";

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  refreshToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  cart: { create: jest.Mock };
  wishlist: { create: jest.Mock };
  wallet: { create: jest.Mock };
  referralCode: { create: jest.Mock };
  $transaction: jest.Mock;
};

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user_1",
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Obi",
    passwordHash: "$2a$12$abcdefghijklmnopqrstuv",
    role: "CUSTOMER",
    adminPermissions: [],
    status: "ACTIVE",
    avatarUrl: null,
    emailVerifiedAt: new Date(),
    phoneVerifiedAt: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    backupCodes: [],
    emailVerificationTokenHash: null,
    emailVerificationExpiresAt: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    preferredCurrency: "NGN",
    preferredLocale: "en",
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("sanitizeUser", () => {
  it("strips sensitive fields before returning a user", () => {
    const user = buildUser({ passwordHash: "secret-hash", twoFactorSecret: "secret-totp" });
    const safe = sanitizeUser(user as never);

    expect(safe).not.toHaveProperty("passwordHash");
    expect(safe).not.toHaveProperty("twoFactorSecret");
    expect(safe).not.toHaveProperty("backupCodes");
    expect(safe).not.toHaveProperty("emailVerificationTokenHash");
    expect(safe).not.toHaveProperty("passwordResetTokenHash");
    expect(safe.email).toBe(user.email);
  });
});

describe("authService.register", () => {
  it("rejects registration when the email is already taken", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser());

    await expect(
      authService.register({
        firstName: "Ada",
        lastName: "Obi",
        email: "ada@example.com",
        password: "Password123",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("creates the user plus starter records and sends a verification email", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const createdUser = buildUser({ status: "PENDING_VERIFICATION", emailVerifiedAt: null });
    mockPrisma.user.create.mockResolvedValueOnce(createdUser);
    mockPrisma.cart.create.mockResolvedValueOnce({});
    mockPrisma.wishlist.create.mockResolvedValueOnce({});
    mockPrisma.wallet.create.mockResolvedValueOnce({});
    mockPrisma.referralCode.create.mockResolvedValueOnce({});
    mockPrisma.$transaction.mockImplementationOnce(async (callback: (tx: unknown) => unknown) =>
      callback(mockPrisma),
    );

    const result = await authService.register({
      firstName: "Ada",
      lastName: "Obi",
      email: "ada@example.com",
      password: "Password123",
    });

    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.cart.create).toHaveBeenCalledWith({ data: { userId: createdUser.id } });
    expect(mockPrisma.wishlist.create).toHaveBeenCalledWith({ data: { userId: createdUser.id } });
    expect(mockPrisma.wallet.create).toHaveBeenCalledWith({ data: { userId: createdUser.id } });
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      createdUser.email,
      expect.any(String),
    );
    expect(result).not.toHaveProperty("passwordHash");
  });
});

describe("authService.login", () => {
  it("rejects an unknown email with a generic error (no user enumeration)", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      authService.login({ email: "nobody@example.com", password: "whatever" }, {}),
    ).rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password" });
  });

  it("rejects a suspended account even with the correct password", async () => {
    const { hashPassword } = await import("@/utils/password");
    const passwordHash = await hashPassword("Password123");
    mockPrisma.user.findUnique.mockResolvedValueOnce(
      buildUser({ passwordHash, status: "SUSPENDED" }),
    );

    await expect(
      authService.login({ email: "ada@example.com", password: "Password123" }, {}),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("signals requiresTwoFactor instead of issuing a session when 2FA is enabled", async () => {
    const { hashPassword } = await import("@/utils/password");
    const passwordHash = await hashPassword("Password123");
    mockPrisma.user.findUnique.mockResolvedValueOnce(
      buildUser({ passwordHash, twoFactorEnabled: true, twoFactorSecret: "ABCDEFGHIJ" }),
    );

    const result = await authService.login(
      { email: "ada@example.com", password: "Password123" },
      {},
    );

    expect(result).toEqual({ requiresTwoFactor: true });
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("issues a session for a correct password with no 2FA enabled", async () => {
    const { hashPassword } = await import("@/utils/password");
    const passwordHash = await hashPassword("Password123");
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser({ passwordHash }));
    mockPrisma.refreshToken.create.mockResolvedValueOnce({});

    const result = await authService.login(
      { email: "ada@example.com", password: "Password123" },
      { userAgent: "jest", ipAddress: "127.0.0.1" },
    );

    expect(result.requiresTwoFactor).toBe(false);
    if (!result.requiresTwoFactor) {
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
    }
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });
});

describe("authService.resetPassword", () => {
  it("rejects an invalid or expired token", async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce(null);

    await expect(authService.resetPassword("bad-token", "NewPassword123")).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("updates the password and revokes all sessions on success", async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce(buildUser());
    mockPrisma.user.update.mockResolvedValueOnce({});
    mockPrisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 2 });

    await authService.resetPassword("valid-token", "NewPassword123");

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        }),
      }),
    );
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1", revokedAt: null } }),
    );
  });
});
