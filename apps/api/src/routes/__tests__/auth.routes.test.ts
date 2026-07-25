import request from "supertest";
import { prisma } from "@/lib/prisma";

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
    $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(mockedTx())),
    $queryRaw: jest.fn(),
  },
}));

jest.mock("@/services/email.service", () => ({
  emailService: {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    send: jest.fn(),
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG"), disconnect: jest.fn() },
}));

function mockedTx() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("@/lib/prisma").prisma;
}

import { createApp } from "@/app";
import { hashPassword } from "@/utils/password";

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
};

const app = createApp();

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user_1",
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Obi",
    passwordHash: "",
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

describe("POST /api/v1/auth/register", () => {
  it("returns 422 for an invalid payload", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({ email: "not-an-email" });
    expect(res.status).toBe(422);
  });

  it("returns 201 and the sanitized user for a valid payload", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const created = buildUser({ status: "PENDING_VERIFICATION", emailVerifiedAt: null });
    mockPrisma.user.create.mockResolvedValueOnce(created);
    mockPrisma.cart.create.mockResolvedValueOnce({});
    mockPrisma.wishlist.create.mockResolvedValueOnce({});
    mockPrisma.wallet.create.mockResolvedValueOnce({});
    mockPrisma.referralCode.create.mockResolvedValueOnce({});

    const res = await request(app).post("/api/v1/auth/register").send({
      firstName: "Ada",
      lastName: "Obi",
      email: "ada@example.com",
      password: "Password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("sets an httpOnly refresh cookie and returns an access token on success", async () => {
    const passwordHash = await hashPassword("Password123");
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser({ passwordHash }));
    mockPrisma.refreshToken.create.mockResolvedValueOnce({});

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ada@example.com", password: "Password123" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    const setCookie = res.headers["set-cookie"];
    expect(setCookie?.[0]).toMatch(/zylix_rt=/);
    expect(setCookie?.[0]).toMatch(/HttpOnly/);
  });

  it("returns 401 for a wrong password without leaking whether the email exists", async () => {
    const passwordHash = await hashPassword("Password123");
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser({ passwordHash }));

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ada@example.com", password: "WrongPassword1" });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns 401 without an Authorization header", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 for a malformed bearer token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/forgot-password", () => {
  it("returns 200 with a generic message even for an unknown email", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account exists/i);
  });
});
