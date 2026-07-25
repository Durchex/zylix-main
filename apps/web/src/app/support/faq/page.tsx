import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Accordion, type AccordionItemData } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about shopping on Zylix.",
};

const FAQ_ITEMS: AccordionItemData[] = [
  {
    question: "What payment methods does Zylix accept?",
    answer:
      "Flutterwave and Paystack (cards, bank transfer, USSD, mobile money) are our primary payment options, settled in Naira. Stripe, PayPal, Apple Pay, and Google Pay are also available for international cards.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "1–3 business days within Lagos and major cities, and 3–7 business days elsewhere in Nigeria. Exact estimates are shown at checkout based on your address.",
  },
  {
    question: "Can I return an item if I change my mind?",
    answer:
      "Yes — most items can be returned within 7 days of delivery if unused and in original packaging. See our Returns & Refunds Policy for full details.",
  },
  {
    question: "Are the products on Zylix genuine?",
    answer:
      "Yes. Every product sold on Zylix — whether from Durchex D.A.M directly or an approved third-party seller — goes through our catalog verification process before it can be listed.",
  },
  {
    question: "How do I track my order?",
    answer:
      "If you're signed in, visit My Orders in your account. As a guest, use Order Tracking with your order number and the email you used at checkout.",
  },
  {
    question: "Do you offer warranty support?",
    answer:
      "Manufacturer warranties apply to all electronics sold on Zylix. Warranty terms are listed on each product page; contact Support if you need help with a claim.",
  },
];

export default function FaqPage() {
  return (
    <Container className="max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">
        Frequently Asked Questions
      </h1>
      <div className="mt-8">
        <Accordion items={FAQ_ITEMS} />
      </div>
    </Container>
  );
}
