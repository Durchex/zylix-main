import { Avatar } from "@/components/ui/Avatar";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export function TestimonialGrid({ title, items }: { title: string; items: Testimonial[] }) {
  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.name} className="rounded-2xl border border-neutral-200 p-5 dark:border-surface-800">
            <p className="text-sm italic text-neutral-700 dark:text-neutral-300">&ldquo;{item.quote}&rdquo;</p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={item.name} size="sm" />
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-neutral-100">{item.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
