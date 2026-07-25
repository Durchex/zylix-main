import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: { findUnique: jest.fn() },
    walletTransaction: { create: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

import { walletProvider } from "@/services/payment/wallet.provider";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  wallet: { findUnique: jest.Mock; update: jest.Mock };
  walletTransaction: { create: jest.Mock };
};

(mockPrisma.wallet as unknown as Record<string, unknown>).update = jest.fn();

const baseParams = {
  orderId: "order_1",
  orderNumber: "ZLX-ABCD1234",
  amount: 50000,
  currency: "NGN",
  email: "ada@example.com",
  userId: "user_1",
  redirectUrl: "https://zylix.example/checkout/confirmation/order_1",
};

describe("walletProvider.initiate", () => {
  it("requires a signed-in account (no guest checkout via wallet)", async () => {
    await expect(walletProvider.initiate({ ...baseParams, userId: undefined })).rejects.toThrow(ApiError);
  });

  it("rejects when the wallet has no balance record", async () => {
    mockPrisma.wallet.findUnique.mockResolvedValueOnce(null);
    await expect(walletProvider.initiate(baseParams)).rejects.toThrow(ApiError);
  });

  it("rejects when the wallet balance is less than the order amount", async () => {
    mockPrisma.wallet.findUnique.mockResolvedValueOnce({ id: "wallet_1", balance: 10000 });
    await expect(walletProvider.initiate(baseParams)).rejects.toThrow(ApiError);
  });

  it("deducts the balance and records a DEBIT transaction on success", async () => {
    mockPrisma.wallet.findUnique.mockResolvedValueOnce({ id: "wallet_1", balance: 100000 });
    mockPrisma.wallet.update.mockResolvedValueOnce({});
    mockPrisma.walletTransaction.create.mockResolvedValueOnce({});

    const result = await walletProvider.initiate(baseParams);

    expect(result.status).toBe("SUCCESS");
    expect(mockPrisma.wallet.update).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      data: { balance: { decrement: 50000 } },
    });
    expect(mockPrisma.walletTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "DEBIT", amount: 50000, referenceOrderId: "order_1" }),
      }),
    );
  });
});
