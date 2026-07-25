import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Hero } from "@/components/sections/Hero";
import { StatsGrid } from "@/components/sections/StatsGrid";
import { TeamGrid } from "@/components/sections/TeamGrid";
import { FeatureGrid } from "@/components/sections/FeatureGrid";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { TestimonialGrid } from "@/components/sections/TestimonialGrid";
import { CTABanner } from "@/components/sections/CTABanner";

export const metadata: Metadata = {
  title: "About Us",
  description: "Zylix is a premium electronics marketplace powered by Durchex D.A.M Company LTD.",
};

export default function AboutPage() {
  return (
    <>
      <Container>
        <Hero
          eyebrow="About Zylix"
          title="Technology Made Simple."
          subtitle="Making quality electronics accessible and affordable across Africa."
        />
      </Container>

      <Container className="max-w-3xl py-10">
        <div className="space-y-6 text-neutral-700 dark:text-neutral-300">
          <p>
            Zylix is a premium electronics marketplace built for Nigeria and beyond — smartphones,
            laptops, gaming devices, smartwatches, accessories, home electronics, and kitchen
            appliances, curated and sold with the same care you&rsquo;d expect from a flagship
            brand store.
          </p>
          <p>
            We&rsquo;re powered by <strong className="text-ink-900 dark:text-neutral-50">Durchex D.A.M Company LTD</strong>,
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

        <div className="mt-10">
          <StatsGrid
            items={[
              { label: "Happy customers", value: "10M+" },
              { label: "Electronics brands", value: "500+" },
              { label: "Countries delivered to", value: "14+" },
            ]}
          />
        </div>
      </Container>

      <Container>
        <TeamGrid
          title="Leadership"
          members={[
            { name: "Adaeze Okafor", role: "Chief Executive Officer", bio: "15 years in African e-commerce and retail operations." },
            { name: "Tunde Bakare", role: "Chief Technology Officer", bio: "Leads platform engineering and product security." },
            { name: "Ngozi Eze", role: "Head of Retail Partnerships", bio: "Builds relationships with brands and sellers across the region." },
          ]}
        />

        <FeatureGrid
          title="How it works"
          numbered
          items={[
            { title: "Browse Electronics", description: "Filter by category, brand, price, and rating to find what you need." },
            { title: "Place Your Order", description: "Checkout securely with local and international payment options." },
            { title: "Enjoy Fast Delivery", description: "Track your order to your door, anywhere we deliver." },
          ]}
        />

        <LogoStrip title="Awards & recognition" logos={["TechCrunch", "Best E-commerce App 2024", "Forbes Africa 30 Under 30", "Webby Honoree"]} />

        <TestimonialGrid
          title="What customers say"
          items={[
            { quote: "Fast delivery and genuine products every time.", name: "Chioma A.", role: "Verified buyer" },
            { quote: "Their customer support resolved my return in a day.", name: "Emeka O.", role: "Verified buyer" },
            { quote: "Best prices I've found on laptops in Nigeria.", name: "Fatima B.", role: "Verified buyer" },
          ]}
        />

        <CTABanner
          title="Explore the latest electronics"
          subtitle="Or join our team — we're always looking for people who care about great retail."
          cta={{ label: "Shop now", href: "/products" }}
        />
      </Container>
    </>
  );
}
