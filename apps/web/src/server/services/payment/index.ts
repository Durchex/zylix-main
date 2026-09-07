import "server-only";
import { ApiError } from "@/server/http/errors";
import type { PaymentProvider } from "@/server/models/enums";
import type { PaymentProviderAdapter } from "./types";
import { flutterwaveProvider } from "./flutterwave.provider";
import { paystackProvider } from "./paystack.provider";
import { stripeProvider } from "./stripe.provider";
import { walletProvider } from "./wallet.provider";
import { bankTransferProvider } from "./bankTransfer.provider";

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

export * from "./types";
