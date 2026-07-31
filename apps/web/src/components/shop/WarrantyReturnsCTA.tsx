import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function WarrantyReturnsCTA() {
  return (
    <section className="rounded-2xl bg-ink-900 px-6 py-8 text-white sm:px-10 dark:bg-surface-900">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">Shop with confidence</h2>
          <p className="mt-2 max-w-md text-sm text-neutral-300">
            Every product ships with full official manufacturer warranty, and you can return
            unopened items within 14 days — no questions asked.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link href="/legal/returns-policy">
            <Button
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 dark:border-white/40 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              Returns policy
            </Button>
          </Link>
          <Link href="/support/faq">
            <Button variant="primary">Warranty FAQ</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
