import { Container } from "@/components/ui/Container";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { DealsCountdownBanner } from "@/components/home/DealsCountdownBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategorySections } from "@/components/home/CategorySections";
import { LogoStrip } from "@/components/home/LogoStrip";
import { TrustBadges, WHY_CHOOSE_FEATURES } from "@/components/home/TrustBadges";
import { NewsletterBar } from "@/components/layout/NewsletterBar";

// Rendered fresh per request rather than statically generated. The catalog
// sections read live product/category data, and a stale build-time snapshot
// showing "no products" is worse than the small cost of an SSR pass.
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

export default function HomePage() {
  return (
    <>
      <HeroBanner />

      <CategoryGrid />

      <DealsCountdownBanner />

      <FeaturedProducts />

      <CategorySections />

      <Container>
        <TrustBadges title="Why Choose ZylixStore?" features={WHY_CHOOSE_FEATURES} layout="row" />

        <LogoStrip title="Top Brands" items={TRUSTED_BRANDS} bordered={false} />
      </Container>

      <NewsletterBar />
    </>
  );
}
