import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CountdownTimer } from "@/components/home/CountdownTimer";

/**
 * End of the current week, used as the promo deadline. Same "derive it
 * locally" approach the daily deals section already takes — there's no
 * campaign/promotion model in the backend to read a real end date from, so
 * inventing one in the UI is the honest option until there is.
 */
function endOfWeekIso() {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59);
  return end.toISOString();
}

export function DealsCountdownBanner() {
  return (
    <Container className="py-6">
      <section className="relative overflow-hidden rounded-2xl bg-secondary-900 px-6 py-8 sm:px-10">
        {/* Soft brand glow so the flat navy doesn't read as a dead rectangle. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-radial-glow" aria-hidden="true" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-white">
            <span className="inline-flex rounded-full bg-deal-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
              Limited Time Offer
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Big <span className="text-accent-300">Deals</span> on Top Brands
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Get up to 50% OFF on selected electronics.
            </p>
            <Link href="/deals" className="mt-5 inline-block">
              <Button size="lg">
                Shop Deals
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </Link>
          </div>

          <div className="shrink-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/70">Ends In</p>
            <CountdownTimer targetIso={endOfWeekIso()} showDays variant="labelled" />
          </div>
        </div>
      </section>
    </Container>
  );
}
