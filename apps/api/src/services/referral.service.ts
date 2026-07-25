import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";

export const referralService = {
  async getMyReferralSummary(userId: string) {
    const referralCode = await prisma.referralCode.findUnique({ where: { userId } });
    if (!referralCode) {
      throw new ApiError(404, "No referral code found for this account");
    }

    const [totalReferred, rewardAggregate] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.rewardPointsLedger.aggregate({
        where: { userId, type: "EARN" },
        _sum: { points: true },
      }),
    ]);

    return {
      code: referralCode.code,
      totalReferred,
      totalRewardsEarned: rewardAggregate._sum.points ?? 0,
    };
  },
};
