"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { readCheckoutAddress, type StoredCheckoutAddress } from "@/lib/checkout";

const PAYMENT_METHODS = [
  { id: "FLUTTERWAVE", label: "Flutterwave", detail: "Card, bank transfer, USSD, mobile money", primary: true, available: true },
  { id: "PAYSTACK", label: "Paystack", detail: "Card, bank transfer, USSD", primary: true, available: true },
  { id: "STRIPE", label: "Stripe", detail: "International cards", primary: false, available: true },
  { id: "WALLET", label: "ZylixStore Wallet", detail: "Pay instantly from your wallet balance", primary: false, available: true },
  { id: "BANK_TRANSFER", label: "Bank Transfer", detail: "Manual transfer, confirmed within 1 business day", primary: false, available: true },
  { id: "PAYPAL", label: "PayPal", detail: "Coming soon", primary: false, available: false },
  { id: "APPLE_PAY", label: "Apple Pay", detail: "Coming soon", primary: false, available: false },
  { id: "GOOGLE_PAY", label: "Google Pay", detail: "Coming soon", primary: false, available: false },
];

interface Courier {
  courierId: string;
  courierName: string;
  serviceCode: string;
  total: number;
  currency: string;
  deliveryEta?: string | null;
}

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clear);

  const [selectedMethod, setSelectedMethod] = useState("FLUTTERWAVE");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couriers, setCouriers] = useState<Courier[] | null>(null);
  const [requestToken, setRequestToken] = useState<string | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items, router]);

  const loadRates = useCallback(async () => {
    const stored: StoredCheckoutAddress = readCheckoutAddress();
    if (!stored.addressId && !stored.shippingAddress) {
      // Landed here without completing step 1.
      router.replace("/checkout");
      return;
    }

    setRatesError(null);
    try {
      const res = await apiRequest<{ couriers: Courier[]; requestToken: string | null }>(
        "/shipping/rates",
        {
          method: "POST",
          body: {
            items: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            ...stored,
          },
        },
      );
      setCouriers(res.couriers);
      setRequestToken(res.requestToken);
      // Default to the cheapest — the option most customers would pick, and
      // it means the order total is never blank while they decide.
      const cheapest = [...res.couriers].sort((a, b) => a.total - b.total)[0] ?? null;
      setSelectedCourier(cheapest);
    } catch (err) {
      setCouriers([]);
      setRatesError(
        err instanceof ApiRequestError ? err.message : "Could not load delivery options.",
      );
    }
  }, [items, router]);

  useEffect(() => {
    if (items.length === 0) return;
    // Deferred past the mount commit — loadRates sets state on its first
    // line, and running it synchronously here would cascade a render.
    const timer = setTimeout(() => void loadRates(), 0);
    return () => clearTimeout(timer);
    // Quoted once for the cart as it stands on arrival; the cart isn't
    // editable from this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePlaceOrder() {
    if (!selectedCourier) {
      setError("Choose a delivery option first.");
      return;
    }

    setError(null);
    setPlacing(true);
    try {
      const stored: StoredCheckoutAddress = readCheckoutAddress();
      const order = await apiRequest<{ orderId: string; checkoutUrl?: string; status: string }>(
        "/orders",
        {
          method: "POST",
          body: {
            items: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            ...stored,
            // Identifiers only — the server prices the courier from its own
            // stored quote, so the fee can't be set from here.
            ...(requestToken
              ? {
                  shipping: {
                    requestToken,
                    courierId: selectedCourier.courierId,
                    serviceCode: selectedCourier.serviceCode,
                  },
                }
              : {}),
            paymentProvider: selectedMethod,
          },
        },
      );
      clearCart();

      if (order.checkoutUrl) {
        // Flutterwave/Paystack/Stripe: redirect to their hosted checkout.
        // They redirect back to the confirmation page once payment completes.
        window.location.href = order.checkoutUrl;
        return;
      }

      // Wallet (settles instantly) and Bank Transfer (pending manual
      // confirmation) have no external redirect — go straight to confirmation.
      router.push(`/checkout/confirmation/${order.orderId}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setPlacing(false);
    }
  }

  const currency = items[0]?.currency ?? "NGN";
  const shippingFee = selectedCourier?.total ?? 0;

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">
        Delivery &amp; Payment
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Step 2 of 2 — choose how it ships and how you&rsquo;d like to pay.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {error && <Alert variant="error">{error}</Alert>}

          <section>
            <h2 className="mb-3 font-semibold text-ink-900 dark:text-neutral-100">Delivery option</h2>

            {couriers === null ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : ratesError ? (
              <Alert variant="error">
                {ratesError}{" "}
                <button type="button" onClick={() => void loadRates()} className="font-semibold underline">
                  Try again
                </button>
              </Alert>
            ) : couriers.length === 0 ? (
              <Alert variant="warning">
                No couriers currently serve that address. Try a different address, or contact support.
              </Alert>
            ) : (
              <div className="space-y-3">
                {couriers.map((courier) => {
                  const isSelected =
                    selectedCourier?.courierId === courier.courierId &&
                    selectedCourier?.serviceCode === courier.serviceCode;
                  return (
                    <button
                      key={`${courier.courierId}:${courier.serviceCode}`}
                      type="button"
                      onClick={() => setSelectedCourier(courier)}
                      className={cn(
                        "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors",
                        isSelected
                          ? "border-brand-500 bg-brand-50 dark:border-accent-500 dark:bg-surface-800"
                          : "border-neutral-200 hover:border-neutral-300 dark:border-surface-700",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "h-5 w-5 shrink-0 rounded-full border-2",
                            isSelected
                              ? "border-brand-500 bg-brand-500 dark:border-accent-500 dark:bg-accent-500"
                              : "border-neutral-300 dark:border-surface-600",
                          )}
                        />
                        <span>
                          <span className="block font-medium text-ink-900 dark:text-neutral-100">
                            {courier.courierName}
                          </span>
                          {courier.deliveryEta && (
                            <span className="block text-sm text-neutral-500 dark:text-neutral-400">
                              {courier.deliveryEta}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-ink-900 dark:text-neutral-100">
                        {courier.total === 0 ? "Free" : formatPrice(courier.total, courier.currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-ink-900 dark:text-neutral-100">Payment method</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  disabled={!method.available}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    selectedMethod === method.id
                      ? "border-brand-500 bg-brand-50 dark:border-accent-500 dark:bg-surface-800"
                      : "border-neutral-200 hover:border-neutral-300 dark:border-surface-700",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink-900 dark:text-neutral-100">{method.label}</p>
                      {method.primary && <Badge variant="brand">Recommended</Badge>}
                      {!method.available && <Badge variant="neutral">Coming soon</Badge>}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{method.detail}</p>
                  </div>
                  <div
                    className={cn(
                      "h-5 w-5 shrink-0 rounded-full border-2",
                      selectedMethod === method.id
                        ? "border-brand-500 bg-brand-500 dark:border-accent-500 dark:bg-accent-500"
                        : "border-neutral-300 dark:border-surface-600",
                    )}
                  />
                </button>
              ))}
            </div>
          </section>
        </div>

        <Card className="h-fit lg:sticky lg:top-40">
          <CardBody className="space-y-4">
            <h2 className="font-semibold text-ink-900 dark:text-neutral-100">Total</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="text-ink-900 dark:text-neutral-100">{formatPrice(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Delivery</span>
                {selectedCourier ? (
                  <span className="text-ink-900 dark:text-neutral-100">
                    {shippingFee === 0 ? "Free" : formatPrice(shippingFee, currency)}
                  </span>
                ) : (
                  <span className="text-neutral-500">Select an option</span>
                )}
              </div>
              {selectedCourier && (
                <p className="text-xs text-neutral-500">
                  via {selectedCourier.courierName}
                  {selectedCourier.deliveryEta ? ` — ${selectedCourier.deliveryEta}` : ""}
                </p>
              )}
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-surface-800">
              <span className="text-ink-900 dark:text-neutral-100">Amount due</span>
              <span className="text-ink-900 dark:text-neutral-100">
                {formatPrice(subtotal + shippingFee, currency)}
              </span>
            </div>
            <Button
              className="w-full"
              size="lg"
              isLoading={placing}
              disabled={!selectedCourier}
              onClick={handlePlaceOrder}
            >
              Place order
            </Button>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
