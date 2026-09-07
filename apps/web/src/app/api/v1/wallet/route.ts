import { withRoute, readQuery } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { walletService } from "@/server/services/wallet.service";
import { walletTransactionListQuerySchema } from "@/server/validation/wallet.schema";

export const GET = withRoute(async (req) => {
  const user = requireAuth(req);
  const query = walletTransactionListQuerySchema.parse(readQuery(req));
  return walletService.getMyWallet(user.id, query);
});
