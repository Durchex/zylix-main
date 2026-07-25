import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "Learn how returns and refunds work at Zylix, or start a return.",
};

const STEPS = [
  { title: "Request a return", detail: "Select the order and item, and choose a reason." },
  { title: "We review it", detail: "Approved requests get return shipping instructions." },
  { title: "Send it back", detail: "Ship the item in its original packaging." },
  { title: "Get refunded", detail: "Refunds post to your Wallet, or original payment method." },
];

export default function SupportReturnsPage() {
  return (
    <Container className="max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Returns & Refunds</h1>
      <p className="mt-2 text-neutral-600">
        Most items can be returned within 7 days of delivery. Here&rsquo;s how it works.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <Card key={step.title}>
            <CardBody>
              <p className="text-xs font-semibold text-brand-600">Step {index + 1}</p>
              <h2 className="mt-1 font-semibold text-ink-900">{step.title}</h2>
              <p className="mt-1 text-sm text-neutral-600">{step.detail}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href="/account/returns">
          <Button>Start a return</Button>
        </Link>
        <Link href="/legal/returns-policy" className="text-sm font-medium text-brand-600 underline underline-offset-2">
          Read the full Returns Policy
        </Link>
      </div>
    </Container>
  );
}
