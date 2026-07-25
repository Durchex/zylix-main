import { prisma } from "@/lib/prisma";
import { paginate } from "@/utils/pagination";
import type { RewardLedgerListQuery } from "@/validation/reward.schema";

export const rewardService = {
  async getMyRewards(userId: string, query: RewardLedgerListQuery) {
    const where = { userId };

    const [entries, total, aggregates] = await Promise.all([
      prisma.rewardPointsLedger.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.rewardPointsLedger.count({ where }),
      prisma.rewardPointsLedger.groupBy({
        by: ["type"],
        where: { userId },
        _sum: { points: true },
      }),
    ]);

    const sumByType = Object.fromEntries(aggregates.map((a) => [a.type, a._sum.points ?? 0]));
    const balance = (sumByType.EARN ?? 0) - (sumByType.REDEEM ?? 0) - (sumByType.EXPIRE ?? 0);

    return {
      balance,
      ledger: paginate(entries, total, query),
    };
  },
};
