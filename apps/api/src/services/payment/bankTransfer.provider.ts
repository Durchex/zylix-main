import crypto from "crypto";
import type { InitiatePaymentParams, InitiatePaymentResult, PaymentProviderAdapter, VerifyPaymentResult } from "@/services/payment/types";

/**
 * No external API — the customer wires funds manually and an admin
 * confirms receipt via the existing `PATCH /admin/orders/:id/status`
 * endpoint (Milestone 9). This provider only reserves a reference number;
 * `verify` always reports pending since there's nothing to poll.
 */
export const bankTransferProvider: PaymentProviderAdapter = {
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const reference = `ZLX-BNK-${crypto.randomBytes(6).toString("hex")}`;
    void params;
    return { providerRef: reference, status: "PENDING" };
  },

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    return { success: false, providerRef, amount: 0, currency: "NGN", raw: null };
  },
};
