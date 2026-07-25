import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "About Us",
  description: "Zylix is a premium electronics marketplace powered by Durchex D.A.M Company LTD.",
};

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-600">About Zylix</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink-900">
        Technology Made Simple.
      </h1>

      <div className="mt-8 space-y-6 text-neutral-700">
        <p>
          Zylix is a premium electronics marketplace built for Nigeria and beyond — smartphones,
          laptops, gaming devices, smartwatches, accessories, home electronics, and kitchen
          appliances, curated and sold with the same care you&rsquo;d expect from a flagship
          brand store.
        </p>
        <p>
          We&rsquo;re powered by <strong className="text-ink-900">Durchex D.A.M Company LTD</strong>,
          which operates Zylix directly and — as the marketplace grows — will open the platform to
          approved third-party sellers, all held to the same standards for authenticity, pricing
          transparency, and fast delivery.
        </p>
        <p>
          Every order on Zylix is backed by secure, Africa-first payment options (Flutterwave and
          Paystack, alongside Stripe, PayPal, Apple Pay, and Google Pay), transparent shipping
          timelines, and a straightforward returns process — because buying electronics online
          should feel as simple as the tagline says.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { label: "Verified sellers", value: "100%" },
          { label: "Delivery coverage", value: "Nationwide" },
          { label: "Return window", value: "7 days" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-neutral-200 p-6 text-center">
            <p className="text-2xl font-bold text-ink-900">{stat.value}</p>
            <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
