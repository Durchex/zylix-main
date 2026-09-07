import { withRoute, readQuery } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { rewardService } from "@/server/services/reward.service";
import { rewardLedgerListQuerySchema } from "@/server/validation/reward.schema";

export const GET = withRoute(async (req) => {
  const user = requireAuth(req);
  const query = rewardLedgerListQuerySchema.parse(readQuery(req));
  return rewardService.getMyRewards(user.id, query);
});
