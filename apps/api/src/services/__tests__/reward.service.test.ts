import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    rewardPointsLedger: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
  },
}));

import { rewardService } from "@/services/reward.service";

const mockPrisma = prisma as unknown as {
  rewardPointsLedger: { findMany: jest.Mock; count: jest.Mock; groupBy: jest.Mock };
};

describe("rewardService.getMyRewards", () => {
  beforeEach(() => jest.clearAllMocks());

  it("scopes the ledger query to the calling user", async () => {
    mockPrisma.rewardPointsLedger.findMany.mockResolvedValueOnce([]);
    mockPrisma.rewardPointsLedger.count.mockResolvedValueOnce(0);
    mockPrisma.rewardPointsLedger.groupBy.mockResolvedValueOnce([]);

    await rewardService.getMyRewards("user_1", { page: 1, pageSize: 10 });

    expect(mockPrisma.rewardPointsLedger.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
    expect(mockPrisma.rewardPointsLedger.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
  });

  it("nets EARN minus REDEEM and EXPIRE into the balance", async () => {
    mockPrisma.rewardPointsLedger.findMany.mockResolvedValueOnce([]);
    mockPrisma.rewardPointsLedger.count.mockResolvedValueOnce(0);
    mockPrisma.rewardPointsLedger.groupBy.mockResolvedValueOnce([
      { type: "EARN", _sum: { points: 500 } },
      { type: "REDEEM", _sum: { points: 150 } },
      { type: "EXPIRE", _sum: { points: 50 } },
    ]);

    const result = await rewardService.getMyRewards("user_1", { page: 1, pageSize: 10 });
    expect(result.balance).toBe(300);
  });

  it("defaults to a zero balance when there's no ledger history yet", async () => {
    mockPrisma.rewardPointsLedger.findMany.mockResolvedValueOnce([]);
    mockPrisma.rewardPointsLedger.count.mockResolvedValueOnce(0);
    mockPrisma.rewardPointsLedger.groupBy.mockResolvedValueOnce([]);

    const result = await rewardService.getMyRewards("user_1", { page: 1, pageSize: 10 });
    expect(result.balance).toBe(0);
  });
});
