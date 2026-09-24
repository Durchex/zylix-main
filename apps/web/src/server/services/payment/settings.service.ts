import "server-only";
import { getEnv } from "@/server/config/env";
import { ApiError } from "@/server/http/errors";
import { isCryptoConfigured } from "@/server/lib/nowpayments";
import { getStoreSettings } from "@/server/services/logistics";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@/server/models/enums";
import type { StoreSettingDoc } from "@/server/models";

/**
 * Customer-facing copy for each method. Kept server-side so checkout and the
 * admin screen describe the same thing, rather than each holding its own
 * hardcoded list that can drift.
 */
const METHOD_COPY: Record<PaymentProvider, { label: string; detail: string; primary: boolean }> = {
  FLUTTERWAVE: {
    label: "Card / Bank / USSD",
    detail: "Pay with a card, bank transfer, USSD or mobile money via Flutterwave",
    primary: true,
  },
  CRYPTO: {
    label: "Cryptocurrency",
    detail: "Pay in Bitcoin, USDT, Ethereum and more — converted at checkout",
    primary: false,
  },
  WALLET: {
    label: "ZylixStore Wallet",
    detail: "Pay instantly from your wallet balance",
    primary: false,
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    detail: "Transfer manually — we confirm receipt within 1 business day",
    primary: false,
  },
};

/**
 * Whether a provider has what it needs to actually take money.
 *
 * For the gateways that means API credentials. For bank transfer it means
 * somewhere to pay into: offering it without an account number gives the
 * customer an order they have no way to settle, so it counts as
 * unconfigured until the details are filled in.
 *
 * The wallet settles against a balance we already hold, so it has no
 * prerequisite — whether it appears is purely the admin's choice.
 */
function isConfigured(provider: PaymentProvider, settings: StoreSettingDoc): boolean {
  switch (provider) {
    case "FLUTTERWAVE":
      return Boolean(getEnv().FLUTTERWAVE_SECRET_KEY);
    case "CRYPTO":
      return isCryptoConfigured();
    case "BANK_TRANSFER":
      return Boolean(settings.bankTransferBankName && settings.bankTransferAccountNumber);
    case "WALLET":
      return true;
  }
}

export interface PaymentMethodStatus {
  provider: PaymentProvider;
  label: string;
  detail: string;
  primary: boolean;
  /** The admin's switch. */
  enabled: boolean;
  /** Whether credentials exist for it on this environment. */
  configured: boolean;
  /** Offered at checkout only when both hold. */
  available: boolean;
}

export const paymentSettingsService = {
  /** Every method with its full status — what the admin screen renders. */
  async listAll(): Promise<PaymentMethodStatus[]> {
    const settings = await getStoreSettings();

    // An absent field is not the same as an empty one. Schema defaults only
    // apply when a document is created, so a settings document written before
    // this field existed reads back as undefined — treating that as "nothing
    // enabled" would take every payment method offline on deploy. Undefined
    // means "never configured", so fall back to all; an explicit empty array
    // means an admin really did switch everything off.
    const enabled = new Set(settings.enabledPaymentMethods ?? PAYMENT_PROVIDERS);

    return PAYMENT_PROVIDERS.map((provider) => {
      const isEnabled = enabled.has(provider);
      const configured = isConfigured(provider, settings);
      return {
        provider,
        ...METHOD_COPY[provider],
        enabled: isEnabled,
        configured,
        available: isEnabled && configured,
      };
    });
  },

  /** Just what checkout should offer. */
  async listAvailable() {
    const all = await this.listAll();
    return all.filter((method) => method.available);
  },

  /**
   * Enforced at order creation, not just hidden in the UI — otherwise a
   * disabled method is still reachable by posting to /orders directly.
   */
  async assertAvailable(provider: PaymentProvider): Promise<void> {
    const all = await this.listAll();
    const method = all.find((m) => m.provider === provider);
    if (!method?.available) {
      throw new ApiError(400, `${method?.label ?? provider} is not available right now`);
    }
  },

  /** Bank details to show once a bank-transfer order is placed. */
  async getBankTransferDetails() {
    const settings = await getStoreSettings();
    if (!settings.bankTransferBankName || !settings.bankTransferAccountNumber) return null;

    return {
      bankName: settings.bankTransferBankName,
      accountName: settings.bankTransferAccountName ?? null,
      accountNumber: settings.bankTransferAccountNumber,
      instructions: settings.bankTransferInstructions ?? null,
    };
  },
};
