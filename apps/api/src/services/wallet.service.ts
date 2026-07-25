import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import type { WalletTransactionListQuery } from "@/validation/wallet.schema";

export const walletService = {
  async getMyWallet(userId: string, query: WalletTransactionListQuery) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    const where = { walletId: wallet.id };
    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return {
      balance: wallet.balance.toString(),
      currency: wallet.currency,
      transactions: paginate(transactions, total, query),
    };
  },
};
