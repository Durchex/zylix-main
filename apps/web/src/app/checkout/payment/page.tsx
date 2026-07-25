"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

const PAYMENT_METHODS = [
  { id: "FLUTTERWAVE", label: "Flutterwave", detail: "Card, bank transfer, USSD, mobile money", primary: true, available: true },
  { id: "PAYSTACK", label: "Paystack", detail: "Card, bank transfer, USSD", primary: true, available: true },
  { id: "STRIPE", label: "Stripe", detail: "International cards", primary: false, available: true },
  { id: "WALLET", label: "Zylix Wallet", detail: "Pay instantly from your wallet balance", primary: false, available: true },
  { id: "BANK_TRANSFER", label: "Bank Transfer", detail: "Manual transfer, confirmed within 1 business day", primary: false, available: true },
  { id: "PAYPAL", label: "PayPal", detail: "Coming soon", primary: false, available: false },
  { id: "APPLE_PAY", label: "Apple Pay", detail: "Coming soon", primary: false, available: false },
  { id: "GOOGLE_PAY", label: "Google Pay", detail: "Coming soon", primary: false, available: false },
];

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clear);

  const [selectedMethod, setSelectedMethod] = useState("FLUTTERWAVE");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items, router]);

  async function handlePlaceOrder() {
    setError(null);
    setPlacing(true);
    try {
      const address = JSON.parse(sessionStorage.getItem("zylix-checkout-address") ?? "{}");
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
            shippingAddress: address,
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

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Payment</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {error && <Alert variant="error">{error}</Alert>}
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              disabled={!method.available}
              onClick={() => setSelectedMethod(method.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-50",
                selectedMethod === method.id
                  ? "border-brand-500 bg-brand-50 dark:border-accent-500 dark:bg-surface-800"
                  : "border-neutral-200 hover:border-neutral-300 dark:border-surface-700 dark:hover:border-surface-600",
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
                  selectedMethod === method.id ? "border-brand-500 bg-brand-500 dark:border-accent-500 dark:bg-accent-500" : "border-neutral-300 dark:border-surface-600",
                )}
              />
            </button>
          ))}
        </div>

        <Card className="h-fit">
          <CardBody className="space-y-4">
            <h2 className="font-semibold text-ink-900 dark:text-neutral-100">Total</h2>
            <div className="flex justify-between text-base font-semibold">
              <span className="text-ink-900 dark:text-neutral-100">Amount due</span>
              <span className="text-ink-900 dark:text-neutral-100">{formatPrice(subtotal, currency)}</span>
            </div>
            <Button className="w-full" isLoading={placing} onClick={handlePlaceOrder}>
              Place order
            </Button>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
