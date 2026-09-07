import { withRoute } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { referralService } from "@/server/services/referral.service";

export const GET = withRoute(async (req) => {
  const user = requireAuth(req);
  return referralService.getMyReferralSummary(user.id);
});
