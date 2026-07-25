# ZYLIX — Payment Integration

**Version:** 1.0
**Status:** Flutterwave, Paystack, Stripe, Wallet, Bank Transfer complete — Milestone 11 of 13
**Depends on:** [API.md](./API.md) (Orders), [DATABASE.md](./DATABASE.md) (`Payment`, `Order`)

No real merchant credentials exist in this environment (same situation as Cloudinary, WhatsApp, etc. since Milestone 4) — every provider below is a genuine, complete integration against that provider's real REST API or SDK, structured to activate the moment real keys are added to `.env`. Nothing here is a mock.

---

## 1. Architecture

`src/services/payment/` defines one shared interface every provider implements:

```ts
interface PaymentProviderAdapter {
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verify(providerRef: string): Promise<VerifyPaymentResult>;
}
```

`getPaymentProvider(provider)` (`services/payment/index.ts`) is the single registry every caller goes through — `orderService.createOrder` and the webhook handlers never talk to a specific provider's SDK directly.

**Redirect-based providers** (Flutterwave, Paystack, Stripe) all return a `checkoutUrl` from `initiate()` — the frontend does one thing regardless of provider: `window.location.href = checkoutUrl`. Stripe uses Checkout Sessions (not Elements/PaymentIntents) specifically so it fits this same shape rather than needing a separate client-side integration path.

**Synchronous providers** (Wallet) settle inside `initiate()` itself — there's no external round-trip, so `status: "SUCCESS"` comes back immediately and the order is marked `PAID` in the same request.

**Manual providers** (Bank Transfer) return `status: "PENDING"` with no `checkoutUrl` — the order sits `PENDING` until an admin confirms it via the existing `PATCH /admin/orders/:id/status` endpoint (Milestone 9), reusing that workflow rather than building a parallel one.

## 2. Order Creation Flow

`POST /orders` (Milestone 8) now does more than create the order:

1. Validate items, prices (server-side only, unchanged since Milestone 8), and stock.
2. Create `Order` + `OrderItem`s + `Payment(status: PENDING)` in one DB transaction, decrementing stock.
3. **Outside** that transaction, call `provider.initiate(...)` — this is an external network call and deliberately isn't allowed to hold a DB transaction open.
4. On success: store `providerRef` on the `Payment`; if the provider settled synchronously (Wallet), mark `Payment` and `Order` as `PAID` immediately.
5. **On failure** (provider not configured, insufficient wallet balance, network error): the order is unwound — stock is restored and the `Order` row is deleted — rather than leaving an orphaned `PENDING` order with no way to ever pay it. Covered by a dedicated test.

## 3. Webhooks

`POST /api/v1/webhooks/{flutterwave,paystack,stripe}` — mounted in `app.ts` with `express.raw()` **before** the global `express.json()` parser, because signature verification needs the exact original request bytes, not a re-serialized `JSON.parse` round-trip.

| Provider | Signature mechanism | Header |
|---|---|---|
| Flutterwave | Static secret hash, constant-time string comparison (not an HMAC) | `verif-hash` |
| Paystack | HMAC-SHA512 of the raw body, keyed with the secret key | `x-paystack-signature` |
| Stripe | `stripe.webhooks.constructEvent()` (official SDK) | `stripe-signature` |

**Defense in depth:** a webhook payload's claimed status is never trusted on its own. `paymentWebhookService.confirmPayment()` re-verifies the transaction directly with the provider (`adapter.verify(providerRef)`) before marking anything paid — a signature proves the request came from the provider, not that the specific claim inside it is still accurate at the moment it's processed. This also makes webhook processing naturally idempotent: a payment already `SUCCESS` short-circuits before any provider call.

## 4. Providers

| Provider | Status | Notes |
|---|---|---|
| **Flutterwave** | ✅ Complete | Primary, per the PRD's Africa-first decision. REST API via `fetch`, no SDK dependency. |
| **Paystack** | ✅ Complete | Primary. REST API via `fetch`. Amounts converted to kobo (smallest unit) on the way out, back to naira on the way in. |
| **Stripe** | ✅ Complete | Secondary/global. Official `stripe` npm package — verified CJS-safe before adding (see the sanitize-html lesson in Milestone 9's notes). |
| **Wallet** | ✅ Complete | Internal — no external API. Debits `Wallet.balance`, records a `WalletTransaction`. Requires a signed-in account. |
| **Bank Transfer** | ✅ Complete | No external API — reserves a reference, order stays `PENDING` for manual admin confirmation. |
| **PayPal** | ⏳ Not implemented | Needs a real PayPal Business account and a client-side wallet-button flow (`@paypal/react-paypal-js` or similar) — a materially different integration shape from the redirect-based providers above, not just a missing API key. |
| **Apple Pay** | ⏳ Not implemented | Needs real Apple Merchant ID + domain verification certificates and a client-side `ApplePaySession` flow (Safari-only). Cannot be meaningfully stubbed without real Apple Developer credentials. |
| **Google Pay** | ⏳ Not implemented | Needs real Google Pay merchant registration and the Google Pay JS API client-side. Same shape mismatch as PayPal/Apple Pay. |

The frontend checkout page (`/checkout/payment`) shows all 8 methods per the PRD, with the three unimplemented ones visibly marked "Coming soon" and disabled — visible and honest about what's real today, not silently missing or dishonestly clickable.

## 5. Configuration

New env vars this milestone: `FLUTTERWAVE_WEBHOOK_SECRET_HASH` (in addition to the existing `FLUTTERWAVE_SECRET_KEY`/`PUBLIC_KEY`/`ENCRYPTION_KEY` from Milestone 4). All payment env vars remain optional at the schema level — a provider's `requireSecretKey()`-style guard throws a clear `503 "X is not configured on this environment"` rather than crashing the whole API at boot when keys are absent, exactly as verified live in this sandbox (no real keys configured, `/orders` correctly fails with a clear message instead of an unhandled exception).

## 6. Known Gaps

- No live payment ever executed against a real provider account in this sandbox (no credentials, same standing limitation noted since Milestone 4) — every provider is unit-tested against mocked `fetch`/Stripe SDK responses, and the webhook signature logic is tested against real cryptographic computations (actual HMAC-SHA512, actual constant-time comparison), but a full live round-trip (real checkout → real webhook delivery) needs real sandbox/test-mode credentials from each provider.
- PayPal, Apple Pay, Google Pay remain unimplemented — see §4 for why each needs more than an API key.
- Refunds are not yet implemented for any provider — `Order.status: REFUNDED` and `Payment.status: REFUNDED` exist in the schema but nothing transitions to them yet.
