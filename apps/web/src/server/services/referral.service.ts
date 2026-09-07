import "server-only";
import { Types } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { Referral, ReferralCode, RewardPointsLedger } from "@/server/models";

export const referralService = {
  async getMyReferralSummary(userId: string) {
    const referralCode = await ReferralCode.findOne({ userId }).lean();
    if (!referralCode) {
      throw new ApiError(404, "No referral code found for this account");
    }

    const [totalReferred, rewardAggregate] = await Promise.all([
      Referral.countDocuments({ referrerId: userId }),
      // aggregate() bypasses Mongoose's automatic string->ObjectId casting,
      // so userId is cast by hand here, unlike the plain find()/count calls.
      RewardPointsLedger.aggregate<{ total: number }>([
        { $match: { userId: new Types.ObjectId(userId), type: "EARN" } },
        { $group: { _id: null, total: { $sum: "$points" } } },
      ]),
    ]);

    return {
      code: referralCode.code,
      totalReferred,
      totalRewardsEarned: rewardAggregate[0]?.total ?? 0,
    };
  },
};
