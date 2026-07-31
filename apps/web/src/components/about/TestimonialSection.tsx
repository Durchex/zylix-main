import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";

// Illustrative sample quotes pending real customer reviews — swap before
// this section is treated as representing verified feedback.
const TESTIMONIALS = [
  {
    name: "Chidinma A.",
    location: "Lagos",
    quote: "Ordered a laptop and it arrived in two days, exactly as described. Easiest checkout I've used.",
  },
  {
    name: "Emeka O.",
    location: "Port Harcourt",
    quote: "Genuine products with real warranty cards — no more guessing with online electronics.",
  },
  {
    name: "Fatima Y.",
    location: "Abuja",
    quote: "Had an issue with a delivery and support sorted it out within a day. Would order again.",
  },
];

export function TestimonialSection() {
  return (
    <section className="border-t border-neutral-200 py-10 dark:border-surface-800">
      <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">
        What shoppers are saying
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="flex flex-col rounded-2xl border border-neutral-200 p-6 dark:border-surface-800"
          >
            <Rating value={5} />
            <p className="mt-3 flex-1 text-sm text-neutral-600 dark:text-neutral-400">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={t.name} size="sm" />
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-neutral-50">{t.name}</p>
                <p className="text-xs text-neutral-500">{t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
