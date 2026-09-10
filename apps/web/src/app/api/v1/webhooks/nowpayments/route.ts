import { NextResponse } from "next/server";
import { withRoute } from "@/server/http/route";
import { ApiError } from "@/server/http/errors";
import {
  verifyNowPaymentsSignature,
  SETTLED_PAYMENT_STATUSES,
  FAILED_PAYMENT_STATUSES,
} from "@/server/lib/nowpayments";
import { paymentWebhookService } from "@/server/services/payment/webhook.service";

interface NowPaymentsIpn {
  payment_id?: string | number;
  invoice_id?: string | number;
  payment_status?: string;
  order_id?: string;
  actually_paid?: number;
  price_amount?: number;
}

export const POST = withRoute(async (req) => {
  const rawBody = await req.text();

  let payload: NowPaymentsIpn;
  try {
    payload = JSON.parse(rawBody) as NowPaymentsIpn;
  } catch {
    throw new ApiError(400, "Malformed webhook payload");
  }

  // NOWPayments signs the re-serialised, key-sorted JSON rather than the raw
  // bytes, so the parsed object is what gets verified — see
  // verifyNowPaymentsSignature.
  if (!verifyNowPaymentsSignature(payload, req.headers.get("x-nowpayments-sig"))) {
    throw new ApiError(401, "Invalid webhook signature");
  }

  const status = payload.payment_status ?? "";
  const paymentId = payload.payment_id === undefined ? null : String(payload.payment_id);
  const invoiceId = payload.invoice_id === undefined ? null : String(payload.invoice_id);

  if (!paymentId && !invoiceId) {
    return NextResponse.json({ received: true });
  }

  // The Payment was created against the invoice id; move it onto the payment
  // id the first time we see one, so verification can look it up from here on.
  if (invoiceId && paymentId) {
    await paymentWebhookService.attachCryptoPaymentId(invoiceId, paymentId);
  }

  const reference = paymentId ?? invoiceId!;

  if (SETTLED_PAYMENT_STATUSES.has(status)) {
    // Goes through the shared path, which re-verifies with NOWPayments rather
    // than trusting the callback's own claim of success.
    await paymentWebhookService.confirmPayment("CRYPTO", reference);
  } else if (FAILED_PAYMENT_STATUSES.has(status)) {
    await paymentWebhookService.failPayment("CRYPTO", reference, status);
  } else {
    // waiting / confirming / sending / partially_paid — still in flight, so
    // the order stays pending and a later callback decides it.
    console.info("[nowpayments] payment in progress", { reference, status });
  }

  return NextResponse.json({ received: true });
});
