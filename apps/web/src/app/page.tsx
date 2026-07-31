import { Container } from "@/components/ui/Container";
import { ProductRail } from "@/components/storefront/ProductRail";
import { HeroBanner } from "@/components/home/HeroBanner";
import { LogoStrip } from "@/components/home/LogoStrip";
import { DealsOfTheDaySection } from "@/components/home/DealsOfTheDaySection";
import { AppDownloadCTA } from "@/components/home/AppDownloadCTA";
import { TrustBadges } from "@/components/home/TrustBadges";
import { FadeIn } from "@/components/motion/FadeIn";

// Forces a fresh server render on every request instead of Next's default
// static-generation-with-ISR. Netlify's Next.js Runtime doesn't reliably
// re-generate this page on its 60s revalidate schedule (confirmed: the
// homepage kept serving an empty "Catalog coming soon" snapshot from the
// build-time render long after real products existed and the API itself
// was responding correctly and fast) — same category of runtime gap as the
// earlier Suspense-streaming and external-rewrites issues on this host.
export const revalidate = 0;

const TRUSTED_BRANDS = [
  { name: "Hisense", src: "/brands/hisense.png" },
  { name: "TCL", src: "/brands/tcl.png" },
  { name: "Brühm", src: "/brands/bruhm.png" },
  { name: "Midea", src: "/brands/midea.png" },
  { name: "Firman", src: "/brands/firman.png" },
  { name: "Haier Thermocool", src: "/brands/haier-thermocool.png" },
  { name: "Skyrun", src: "/brands/skyrun.png" },
  { name: "Scanfrost", src: "/brands/scanfrost.png" },
];
const PRESS_MENTIONS = [
  "Featured in TechCrunch",
  "Best E-commerce App 2024",
  "TechRadar Recommended",
  "Deloitte Fast 50",
];

export default function HomePage() {
  return (
    <>
      <div className="bg-brand-700 py-2 text-center text-xs font-medium text-white sm:text-sm">
        Free standard shipping on orders over ₦100,000 — nationwide delivery across Nigeria.
      </div>

      <Container>
        <div className="py-6">
          <FadeIn>
            <HeroBanner />
          </FadeIn>
        </div>

        <ProductRail
          title="Featured products"
          description="Handpicked across smartphones, laptops, and home electronics."
          href="/shop?featured=true"
          query="?featured=true&pageSize=8"
        />

        <ProductRail
          title="Top selling"
          description="The most popular electronics with shoppers right now."
          href="/shop?sort=rating"
          query="?sort=rating&pageSize=8"
        />

        <LogoStrip eyebrow="Trusted brands" title="Shop the brands you know" items={TRUSTED_BRANDS} />

        <DealsOfTheDaySection />

        <div className="py-8">
          <AppDownloadCTA />
        </div>

        <TrustBadges />

        <LogoStrip eyebrow="Recognition" title="As seen in" items={PRESS_MENTIONS} dense />
      </Container>
    </>
  );
}
