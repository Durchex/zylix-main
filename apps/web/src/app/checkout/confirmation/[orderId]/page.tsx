import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { serverApiRequest } from "@/lib/server-api";

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
            been created. If you chose bank transfer, complete your transfer and we&rsquo;ll
            confirm it within 1 business day. If you were redirected here after paying, your
            payment is still being confirmed — check back shortly.
          </>
        )}
      </p>
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
