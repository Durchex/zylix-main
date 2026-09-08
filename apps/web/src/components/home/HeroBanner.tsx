import Link from "next/link";
import { Button } from "@/components/ui/Button";

const HERO_POINTS = [
  {
    label: "Original Products",
    sub: "& Warranty",
    icon: (
      <path d="M10 2.5l6 2.5v4.5c0 3.9-2.6 7.4-6 8.5-3.4-1.1-6-4.6-6-8.5V5z" strokeLinejoin="round" />
    ),
  },
  {
    label: "Fast & Reliable",
    sub: "Delivery",
    icon: (
      <>
        <path d="M2 6h9v8H2zM11 8h4l3 3v3h-7z" strokeLinejoin="round" />
        <circle cx="5.5" cy="16" r="1.5" />
        <circle cx="14.5" cy="16" r="1.5" />
      </>
    ),
  },
  {
    label: "Secure",
    sub: "Payments",
    icon: (
      <>
        <rect x="2.5" y="5" width="15" height="10" rx="2" />
        <path d="M2.5 8.5h15" />
      </>
    ),
  },
];

/**
 * Home hero. The right-hand side is an inline SVG arrangement of appliance
 * silhouettes rather than a photographic collage — there's no product-collage
 * asset in public/, and generating one isn't something this component should
 * own. It reads as intentional art direction at any viewport, and swapping in
 * a real photograph later is a one-element change.
 */
export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-brand">
      <div className="mx-auto grid w-full max-w-[1600px] items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-4 lg:px-8 lg:py-14">
        <div className="text-white">
          <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em]">
            Premium Electronics Store
          </span>
          <h1 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Top-Quality Electronics
            <br />
            <span className="text-accent-300">for a Smarter Home</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm text-white/85 sm:text-base">
            From stunning TVs to powerful home appliances, get the latest electronics at the best
            prices. Quality. Warranty. Fast Delivery.
          </p>

          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            {HERO_POINTS.map((point) => (
              <div key={point.label} className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {point.icon}
                  </svg>
                </span>
                <span className="text-xs leading-tight">
                  <dt className="font-semibold">{point.label}</dt>
                  <dd className="text-white/75">{point.sub}</dd>
                </span>
              </div>
            ))}
          </dl>

          <Link href="/shop" className="mt-7 inline-block">
            <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90">
              Shop Now
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </Link>
        </div>

        <div className="relative hidden justify-center lg:flex">
          <HeroArtwork />
          <span className="absolute right-2 top-2 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-accent-400 text-center text-brand-900 shadow-glow">
            <span className="text-[10px] font-bold uppercase tracking-wide">Up to</span>
            <span className="text-2xl font-extrabold leading-none">50%</span>
            <span className="text-[11px] font-bold uppercase tracking-wide">Off</span>
          </span>
        </div>
      </div>
    </section>
  );
}

function HeroArtwork() {
  return (
    <svg
      viewBox="0 0 420 260"
      className="h-auto w-full max-w-lg text-white/90"
      fill="none"
      aria-hidden="true"
    >
      {/* TV */}
      <rect x="150" y="30" width="180" height="110" rx="6" fill="currentColor" opacity="0.15" />
      <rect x="150" y="30" width="180" height="110" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M225 140v14M200 160h50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Fridge */}
      <rect x="30" y="60" width="80" height="150" rx="8" fill="currentColor" opacity="0.15" />
      <rect x="30" y="60" width="80" height="150" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <path d="M30 115h80M96 88v16M96 130v18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Washing machine */}
      <rect x="150" y="175" width="85" height="70" rx="8" fill="currentColor" opacity="0.15" />
      <rect x="150" y="175" width="85" height="70" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="192" cy="212" r="20" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="192" cy="212" r="9" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      {/* Air conditioner */}
      <rect x="262" y="175" width="128" height="42" rx="8" fill="currentColor" opacity="0.15" />
      <rect x="262" y="175" width="128" height="42" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <path d="M276 205h100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      {/* Speaker */}
      <rect x="350" y="55" width="46" height="105" rx="6" fill="currentColor" opacity="0.15" />
      <rect x="350" y="55" width="46" height="105" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="373" cy="88" r="12" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="373" cy="128" r="7" stroke="currentColor" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}
