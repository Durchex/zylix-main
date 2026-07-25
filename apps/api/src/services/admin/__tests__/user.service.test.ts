import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    refreshToken: { updateMany: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

import { adminUserService } from "@/services/admin/user.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock; update: jest.Mock };
  refreshToken: { updateMany: jest.Mock };
  auditLog: { create: jest.Mock };
};

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user_1",
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Obi",
    passwordHash: "hash",
    role: "CUSTOMER",
    status: "ACTIVE",
    adminPermissions: [],
    twoFactorEnabled: false,
    twoFactorSecret: null,
    backupCodes: [],
    ...overrides,
  };
}

describe("adminUserService.updateStatus", () => {
  it("throws 404 for an unknown user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      adminUserService.updateStatus("does-not-exist", { status: "SUSPENDED" }, "admin_1"),
    ).rejects.toThrow(ApiError);
  });

  it("refuses to change the status of an ADMIN account", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser({ role: "ADMIN" }));
    await expect(
      adminUserService.updateStatus("user_1", { status: "SUSPENDED" }, "admin_1"),
    ).rejects.toThrow(ApiError);
  });

  it("revokes all sessions when suspending a customer", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser());
    mockPrisma.user.update.mockResolvedValueOnce(buildUser({ status: "SUSPENDED" }));

    await adminUserService.updateStatus("user_1", { status: "SUSPENDED" }, "admin_1");

    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1", revokedAt: null } }),
    );
  });

  it("does not revoke sessions when reactivating a user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser({ status: "SUSPENDED" }));
    mockPrisma.user.update.mockResolvedValueOnce(buildUser({ status: "ACTIVE" }));

    await adminUserService.updateStatus("user_1", { status: "ACTIVE" }, "admin_1");

    expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("never leaks passwordHash or 2FA secrets in the response", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(buildUser());
    mockPrisma.user.update.mockResolvedValueOnce(buildUser({ status: "BANNED" }));

    const result = await adminUserService.updateStatus("user_1", { status: "BANNED" }, "admin_1");

    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("twoFactorSecret");
    expect(result).not.toHaveProperty("backupCodes");
  });
});
