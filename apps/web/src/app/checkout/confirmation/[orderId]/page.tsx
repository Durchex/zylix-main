import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { serverApiRequest } from "@/lib/server-api";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

interface OrderConfirmation {
  orderNumber: string;
  total: string;
  currency: string;
  status: string;
  paymentProvider: string | null;
  bankTransfer: {
    bankName: string;
    accountName: string | null;
    accountNumber: string;
    instructions: string | null;
  } | null;
}

export default async function CheckoutConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderId } = await params;
  const result = await serverApiRequest<{ order: OrderConfirmation }>(`/orders/${orderId}`, {
    revalidate: 0,
  });

  if (!result?.order) {
    notFound();
  }

  const isPaid = result.order.status === "PAID";

  return (
    <Container className="flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${isPaid ? "bg-success-subtle" : "bg-warning-subtle"}`}
      >
        {isPaid ? (
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-success" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-warning" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">
        {isPaid ? "Order Confirmed" : "Order Received — Payment Pending"}
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        {isPaid ? (
          <>
            Order <span className="font-medium text-ink-900 dark:text-neutral-100">{result.order.orderNumber}</span> has
            been placed and paid. We&rsquo;ll email you as it ships.
          </>
        ) : (
          <>
            Order <span className="font-medium text-ink-900 dark:text-neutral-100">{result.order.orderNumber}</span> has
            been created.{" "}
            {result.order.bankTransfer
              ? "Transfer the total to the account below and we'll confirm it within 1 business day."
              : "If you were redirected here after paying, your payment is still being confirmed — check back shortly."}
          </>
        )}
      </p>
      {result.order.bankTransfer && (
        <div className="mt-8 w-full rounded-2xl border border-neutral-200 bg-white p-5 text-left dark:border-surface-800 dark:bg-surface-900">
          <p className="text-sm font-semibold text-ink-900 dark:text-neutral-100">
            Transfer {formatPrice(Number(result.order.total), result.order.currency)} to
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Bank</dt>
              <dd className="font-medium text-ink-900 dark:text-neutral-100">
                {result.order.bankTransfer.bankName}
              </dd>
            </div>
            {result.order.bankTransfer.accountName && (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500 dark:text-neutral-400">Account name</dt>
                <dd className="font-medium text-ink-900 dark:text-neutral-100">
                  {result.order.bankTransfer.accountName}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500 dark:text-neutral-400">Account number</dt>
              <dd className="font-mono font-semibold tracking-wide text-ink-900 dark:text-neutral-100">
                {result.order.bankTransfer.accountNumber}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-neutral-200 pt-2 dark:border-surface-800">
              <dt className="text-neutral-500 dark:text-neutral-400">Reference</dt>
              <dd className="font-medium text-ink-900 dark:text-neutral-100">
                {result.order.orderNumber}
              </dd>
            </div>
          </dl>
          {result.order.bankTransfer.instructions && (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              {result.order.bankTransfer.instructions}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link href="/account/orders">
          <Button variant="outline">View order</Button>
        </Link>
        <Link href="/shop">
          <Button>Continue shopping</Button>
        </Link>
      </div>
    </Container>
  );
}
