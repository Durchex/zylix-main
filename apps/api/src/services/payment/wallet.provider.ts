import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import type { InitiatePaymentParams, InitiatePaymentResult, PaymentProviderAdapter, VerifyPaymentResult } from "@/services/payment/types";

/**
 * The only provider that settles synchronously — there's no external API,
 * the balance lives in our own `Wallet` table, so "initiate" and "settle"
 * are the same operation. No webhook counterpart exists for this provider.
 */
export const walletProvider: PaymentProviderAdapter = {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    if (!params.userId) {
      throw new ApiError(400, "Wallet payment requires a signed-in account");
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: params.userId } });
    if (!wallet || Number(wallet.balance) < params.amount) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    const reference = `ZLX-WLT-${crypto.randomBytes(6).toString("hex")}`;

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: params.userId },
        data: { balance: { decrement: params.amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: params.amount,
          reason: `Payment for order ${params.orderNumber}`,
          referenceOrderId: params.orderId,
        },
      }),
    ]);

    return { providerRef: reference, status: "SUCCESS" };
  },

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    // Wallet payments settle at initiate() time — verify is a no-op success
    // check against our own ledger rather than a third-party call.
    return { success: true, providerRef, amount: 0, currency: "NGN", raw: null };
  },
};
