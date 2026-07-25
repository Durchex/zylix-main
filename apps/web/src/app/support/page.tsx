import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Support Center",
  description: "Get help with orders, returns, and more at Zylix.",
};

const SUPPORT_LINKS = [
  {
    href: "/support/faq",
    title: "Frequently Asked Questions",
    description: "Quick answers about orders, payments, and shipping.",
  },
  {
    href: "/support/order-tracking",
    title: "Track Your Order",
    description: "Check the status of an order using your order number.",
  },
  {
    href: "/support/returns",
    title: "Returns & Refunds",
    description: "Start a return or learn how refunds work.",
  },
  {
    href: "/support/contact",
    title: "Contact Us",
    description: "Reach our support team directly.",
  },
];

export default function SupportPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Support Center</h1>
      <p className="mt-2 max-w-xl text-neutral-600">
        We&rsquo;re here to help. Choose a topic below, or contact us directly.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {SUPPORT_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full hover:border-brand-300 hover:shadow-soft">
              <CardBody>
                <h2 className="font-semibold text-ink-900">{link.title}</h2>
                <p className="mt-1 text-sm text-neutral-600">{link.description}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
