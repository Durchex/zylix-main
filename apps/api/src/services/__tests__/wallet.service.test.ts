import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: { findUnique: jest.fn() },
    walletTransaction: { findMany: jest.fn(), count: jest.fn() },
  },
}));

import { walletService } from "@/services/wallet.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  wallet: { findUnique: jest.Mock };
  walletTransaction: { findMany: jest.Mock; count: jest.Mock };
};

describe("walletService.getMyWallet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws 404 when the calling user has no wallet", async () => {
    mockPrisma.wallet.findUnique.mockResolvedValueOnce(null);

    await expect(
      walletService.getMyWallet("user_1", { page: 1, pageSize: 10 }),
    ).rejects.toThrow(ApiError);
  });

  it("scopes transaction history to the calling user's own wallet", async () => {
    mockPrisma.wallet.findUnique.mockResolvedValueOnce({
      id: "wallet_1",
      userId: "user_1",
      balance: { toString: () => "5000.00" },
      currency: "NGN",
    });
    mockPrisma.walletTransaction.findMany.mockResolvedValueOnce([{ id: "txn_1" }]);
    mockPrisma.walletTransaction.count.mockResolvedValueOnce(1);

    const result = await walletService.getMyWallet("user_1", { page: 1, pageSize: 10 });

    expect(mockPrisma.walletTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { walletId: "wallet_1" } }),
    );
    expect(result).toMatchObject({ balance: "5000.00", currency: "NGN" });
    expect(result.transactions.items).toHaveLength(1);
  });
});
