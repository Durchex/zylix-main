import Link from "next/link";
import { Button } from "@/components/ui/Button";

const HERO_TAGS = ["Smartphones", "TVs", "Laptops", "Gaming"];

export function HeroBanner() {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-brand px-6 py-10 text-white sm:px-10 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
        Seasonal sale — up to 40% off
      </p>
      <h1 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-4xl">
        Top deals on the electronics you actually want.
      </h1>
      <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-base">
        New arrivals on smartphones and TVs, plus limited-time markdowns across every category —
        all backed by authenticated stock and nationwide delivery.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/deals">
          <Button variant="primary" size="lg">
            Shop today&apos;s deals
          </Button>
        </Link>
        <Link href="/new-arrivals">
          <Button
            variant="outline"
            size="lg"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 dark:border-white/40 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
          >
            See new arrivals
          </Button>
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {HERO_TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}
