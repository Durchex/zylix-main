import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { LogoStrip } from "@/components/home/LogoStrip";
import { HowItWorksSection } from "@/components/about/HowItWorksSection";
import { TeamSection } from "@/components/about/TeamSection";
import { TestimonialSection } from "@/components/about/TestimonialSection";

export const metadata: Metadata = {
  title: "About Us",
  description: "ZylixStore is a premium electronics marketplace powered by Durchex D.A.M Company LTD.",
};

const RECOGNITION = [
  "Featured in TechCrunch",
  "Best E-commerce App 2024",
  "TechRadar Recommended",
  "Deloitte Fast 50",
];

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-600">About ZylixStore</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">
        Making quality electronics accessible and affordable across Nigeria.
      </h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
        We believe buying a smartphone, laptop, or home appliance online should be as simple and
        trustworthy as walking into a flagship store — genuine products, fair prices, and honest
        delivery timelines.
      </p>

      <div className="mt-10 space-y-6 text-neutral-700 dark:text-neutral-300">
        <p>
          ZylixStore started as a small online electronics shop, built on a simple idea: shoppers
          deserve to know exactly what they&rsquo;re buying, exactly when it will arrive, and
          exactly what to do if something goes wrong. That idea grew into a full marketplace for
          smartphones, laptops, gaming devices, smartwatches, accessories, home electronics, and
          kitchen appliances — curated and sold with the same care you&rsquo;d expect from a
          flagship brand store.
        </p>
        <p>
          We&rsquo;re powered by <strong className="text-ink-900 dark:text-neutral-100">Durchex D.A.M Company LTD</strong>,
          which operates ZylixStore directly and — as the marketplace grows — will open the platform to
          approved third-party sellers, all held to the same standards for authenticity, pricing
          transparency, and fast delivery.
        </p>
        <p>
          Every order on ZylixStore is backed by secure, Africa-first payment options (Flutterwave and
          Paystack, alongside Stripe, PayPal, Apple Pay, and Google Pay), transparent shipping
          timelines, and a straightforward returns process — because buying electronics online
          should feel as simple as our tagline says.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { label: "Happy customers", value: "10,000+" },
          { label: "Electronics brands", value: "50+" },
          { label: "Delivery coverage", value: "Nationwide" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-neutral-200 p-6 text-center dark:border-surface-800">
            <p className="text-2xl font-bold text-ink-900 dark:text-neutral-50">{stat.value}</p>
            <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <TeamSection />

      <HowItWorksSection />

      <LogoStrip eyebrow="Recognition" title="As seen in" items={RECOGNITION} dense />

      <TestimonialSection />

      <section className="mt-10 rounded-2xl bg-ink-900 px-6 py-10 text-center text-white dark:bg-surface-900">
        <h2 className="text-xl font-bold sm:text-2xl">Ready to explore?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-300">
          Browse the latest electronics, or reach out if you&rsquo;d like to join the team.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop">
            <Button variant="primary">Shop the latest electronics</Button>
          </Link>
          <Link href="/support/contact">
            <Button
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 dark:border-white/40 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              Join the team
            </Button>
          </Link>
        </div>
      </section>
    </Container>
  );
}
