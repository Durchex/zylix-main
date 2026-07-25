import type { PaymentProvider } from "@prisma/client";
import { ApiError } from "@/middleware/errorHandler";
import type { PaymentProviderAdapter } from "@/services/payment/types";
import { flutterwaveProvider } from "@/services/payment/flutterwave.provider";
import { paystackProvider } from "@/services/payment/paystack.provider";
import { stripeProvider } from "@/services/payment/stripe.provider";
import { walletProvider } from "@/services/payment/wallet.provider";
import { bankTransferProvider } from "@/services/payment/bankTransfer.provider";

const registry: Partial<Record<PaymentProvider, PaymentProviderAdapter>> = {
  FLUTTERWAVE: flutterwaveProvider,
  PAYSTACK: paystackProvider,
  STRIPE: stripeProvider,
  WALLET: walletProvider,
  BANK_TRANSFER: bankTransferProvider,
  // PAYPAL, APPLE_PAY, GOOGLE_PAY are not yet implemented — they need
  // client-side wallet-button SDK flows and real merchant registration
  // (PayPal business account; Apple/Google merchant certs), a materially
  // different integration shape from the redirect-based providers above.
  // Documented in docs/PAYMENTS.md as explicit remaining work.
};

export function getPaymentProvider(provider: PaymentProvider): PaymentProviderAdapter {
  const adapter = registry[provider];
  if (!adapter) {
    throw new ApiError(400, `${provider} is not yet available as a payment method`);
  }
  return adapter;
}

export * from "@/services/payment/types";
