import "server-only";
import { Types } from "mongoose";
import { paginate } from "@/server/lib/pagination";
import { RewardPointsLedger, type RewardPointsLedgerDoc } from "@/server/models";
import type { RewardLedgerListQuery } from "@/server/validation/reward.schema";

function toDto(entry: RewardPointsLedgerDoc) {
  return {
    id: String(entry._id),
    userId: String(entry.userId),
    points: entry.points,
    type: entry.type,
    sourceOrderId: entry.sourceOrderId ?? null,
    createdAt: entry.createdAt,
  };
}

export const rewardService = {
  async getMyRewards(userId: string, query: RewardLedgerListQuery) {
    const filter = { userId };

    // Prisma's groupBy({ by: ["type"], _sum: { points } }) has no single-call
    // equivalent on a Mongoose model — an aggregation pipeline does the same
    // job.
    const [entries, total, aggregates] = await Promise.all([
      RewardPointsLedger.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<RewardPointsLedgerDoc[]>(),
      RewardPointsLedger.countDocuments(filter),
      // aggregate() bypasses Mongoose's automatic string->ObjectId casting,
      // unlike find()/countDocuments() above — the id has to be cast by hand
      // here or $match silently compares a string to every document's
      // ObjectId and matches nothing.
      RewardPointsLedger.aggregate<{ _id: string; total: number }>([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: "$type", total: { $sum: "$points" } } },
      ]),
    ]);

    const sumByType = Object.fromEntries(aggregates.map((a) => [a._id, a.total]));
    const balance = (sumByType.EARN ?? 0) - (sumByType.REDEEM ?? 0) - (sumByType.EXPIRE ?? 0);

    return {
      balance,
      ledger: paginate(entries.map(toDto), total, query),
    };
  },
};
