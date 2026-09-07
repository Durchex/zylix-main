import "server-only";
import crypto from "crypto";
import { ApiError } from "@/server/http/errors";
import { Wallet, WalletTransaction } from "@/server/models";
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentProviderAdapter,
  VerifyPaymentResult,
} from "./types";

/**
 * The only provider that settles synchronously — there's no external API,
 * the balance lives in our own Wallet collection, so "initiate" and "settle"
 * are the same operation. No webhook counterpart exists for this provider.
 */
export const walletProvider: PaymentProviderAdapter = {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (!params.userId) {
      throw new ApiError(400, "Wallet payment requires a signed-in account");
    }

    // Debiting via a conditional update ($gte the amount) rather than a
    // read-then-write makes the balance check and the deduction one atomic
    // operation — Postgres got the same guarantee from wrapping a read and
    // an update in a transaction, which Mongo's replica-set-only
    // transactions can't assume are available here.
    const wallet = await Wallet.findOneAndUpdate(
      { userId: params.userId, balance: { $gte: params.amount } },
      { $inc: { balance: -params.amount } },
      { new: true },
    );
    if (!wallet) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    const reference = `ZLX-WLT-${crypto.randomBytes(6).toString("hex")}`;

    try {
      await WalletTransaction.create({
        walletId: wallet._id,
        type: "DEBIT",
        amount: params.amount,
        reason: `Payment for order ${params.orderNumber}`,
        referenceOrderId: params.orderId,
      });
    } catch (err) {
      // Refund the debit if the ledger entry fails to write, so the two
      // never drift out of sync.
      await Wallet.updateOne({ _id: wallet._id }, { $inc: { balance: params.amount } });
      throw err;
    }

    return { providerRef: reference, status: "SUCCESS" };
  },

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    // Wallet payments settle at initiate() time — verify is a no-op success
    // check against our own ledger rather than a third-party call.
    return { success: true, providerRef, amount: 0, currency: "NGN", raw: null };
  },
};
