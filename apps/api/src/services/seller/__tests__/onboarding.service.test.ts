import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    seller: { findUnique: jest.fn(), create: jest.fn() },
    user: { update: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

import { sellerOnboardingService } from "@/services/seller/onboarding.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  seller: { findUnique: jest.Mock; create: jest.Mock };
  user: { update: jest.Mock };
};

const input = { storeName: "Test Store", storeSlug: "test-store" };

describe("sellerOnboardingService.apply", () => {
  it("rejects a user who already has a seller profile", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce({ id: "existing" });
    await expect(sellerOnboardingService.apply("user_1", input)).rejects.toThrow(ApiError);
  });

  it("rejects a store slug that's already taken", async () => {
    mockPrisma.seller.findUnique
      .mockResolvedValueOnce(null) // no existing profile for this user
      .mockResolvedValueOnce({ id: "other_seller" }); // slug taken

    await expect(sellerOnboardingService.apply("user_1", input)).rejects.toThrow(ApiError);
  });

  it("creates the seller profile and flips the user's role to SELLER", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockPrisma.seller.create.mockResolvedValueOnce({ id: "seller_1", status: "PENDING" });
    mockPrisma.user.update.mockResolvedValueOnce({ id: "user_1", role: "SELLER" });

    const result = await sellerOnboardingService.apply("user_1", input);

    expect(result.status).toBe("PENDING");
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { role: "SELLER" },
    });
  });
});

describe("sellerOnboardingService.getMyProfile", () => {
  it("throws 404 when the user has no seller profile", async () => {
    mockPrisma.seller.findUnique.mockResolvedValueOnce(null);
    await expect(sellerOnboardingService.getMyProfile("user_1")).rejects.toThrow(ApiError);
  });
});
