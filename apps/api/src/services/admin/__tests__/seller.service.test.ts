import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    seller: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

import { adminSellerService } from "@/services/admin/seller.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  seller: { findUnique: jest.Mock; update: jest.Mock };
  auditLog: { create: jest.Mock };
};

describe("adminSellerService.approve", () => {
  it("throws 404 for an unknown seller", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce(null);
    await expect(adminSellerService.approve("does-not-exist", "admin_1")).rejects.toThrow(ApiError);
  });

  it("rejects approving an already-approved seller", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce({ id: "seller_1", status: "APPROVED" });
    await expect(adminSellerService.approve("seller_1", "admin_1")).rejects.toThrow(ApiError);
  });

  it("approves a pending seller and records an audit log entry", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce({
      id: "seller_1",
      status: "PENDING",
      storeName: "Test Store",
    });
    mockPrisma.seller.update.mockResolvedValueOnce({ id: "seller_1", status: "APPROVED" });

    await adminSellerService.approve("seller_1", "admin_1");

    expect(mockPrisma.seller.update).toHaveBeenCalledWith({
      where: { id: "seller_1" },
      data: { status: "APPROVED" },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ actorId: "admin_1", action: "SELLER_APPROVED" }),
      }),
    );
  });
});

describe("adminSellerService.reject", () => {
  it("throws 404 for an unknown seller", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce(null);
    await expect(adminSellerService.reject("does-not-exist", "admin_1")).rejects.toThrow(ApiError);
  });

  it("rejects the seller and records the reason in the audit log", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce({
      id: "seller_1",
      status: "PENDING",
      storeName: "Test Store",
    });
    mockPrisma.seller.update.mockResolvedValueOnce({ id: "seller_1", status: "REJECTED" });

    await adminSellerService.reject("seller_1", "admin_1", "Incomplete documentation");

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "SELLER_REJECTED",
          metadata: expect.objectContaining({ reason: "Incomplete documentation" }),
        }),
      }),
    );
  });
});
