import { Avatar } from "@/components/ui/Avatar";
import { Rating } from "@/components/ui/Rating";

export interface ReviewItem {
  name: string;
  rating: number;
  comment: string;
}

export function ReviewList({ title, items }: { title: string; items: ReviewItem[] }) {
  return (
    <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-surface-800">
      <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
      <div className="space-y-4">
        {items.map((review) => (
          <div key={review.name} className="rounded-2xl border border-neutral-200 p-5 dark:border-surface-800">
            <div className="flex items-center gap-3">
              <Avatar name={review.name} size="sm" />
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-neutral-100">{review.name}</p>
                <Rating value={review.rating} />
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{review.comment}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
