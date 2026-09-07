import "server-only";
import { ApiError } from "@/server/http/errors";
import { paginate } from "@/server/lib/pagination";
import { Wallet, WalletTransaction, type WalletTransactionDoc } from "@/server/models";
import type { WalletTransactionListQuery } from "@/server/validation/wallet.schema";

function toDto(txn: WalletTransactionDoc) {
  return {
    id: String(txn._id),
    walletId: String(txn.walletId),
    type: txn.type,
    amount: String(txn.amount),
    reason: txn.reason,
    referenceOrderId: txn.referenceOrderId ? String(txn.referenceOrderId) : null,
    createdAt: txn.createdAt,
  };
}

export const walletService = {
  async getMyWallet(userId: string, query: WalletTransactionListQuery) {
    const wallet = await Wallet.findOne({ userId }).lean();
    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    const filter = { walletId: wallet._id };
    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<WalletTransactionDoc[]>(),
      WalletTransaction.countDocuments(filter),
    ]);

    return {
      balance: String(wallet.balance),
      currency: wallet.currency,
      transactions: paginate(transactions.map(toDto), total, query),
    };
  },
};
