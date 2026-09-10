import "server-only";
import { ApiError } from "@/server/http/errors";
import type { PaymentProvider } from "@/server/models/enums";
import type { PaymentProviderAdapter } from "./types";
import { flutterwaveProvider } from "./flutterwave.provider";
import { cryptoProvider } from "./crypto.provider";
import { walletProvider } from "./wallet.provider";
import { bankTransferProvider } from "./bankTransfer.provider";

const registry: Record<PaymentProvider, PaymentProviderAdapter> = {
  FLUTTERWAVE: flutterwaveProvider,
  CRYPTO: cryptoProvider,
  WALLET: walletProvider,
  BANK_TRANSFER: bankTransferProvider,
};

export function getPaymentProvider(provider: PaymentProvider): PaymentProviderAdapter {
  const adapter = registry[provider];
  if (!adapter) {
    throw new ApiError(400, `${provider} is not yet available as a payment method`);
  }
  return adapter;
}

export * from "./types";
