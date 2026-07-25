import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CTABanner({
  title,
  subtitle,
  cta,
  tone = "light",
}: {
  title: string;
  subtitle?: string;
  cta: { label: string; href: string };
  tone?: "light" | "dark";
}) {
  return (
    <section
      className={
        tone === "dark"
          ? "my-8 flex flex-col items-start gap-4 rounded-2xl bg-ink-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between"
          : "my-8 flex flex-col items-start gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-6 dark:border-brand-900/50 dark:bg-brand-900/10 sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <div>
        <h2 className={tone === "dark" ? "text-lg font-bold text-white" : "text-lg font-bold text-ink-900 dark:text-neutral-50"}>
          {title}
        </h2>
        {subtitle && (
          <p className={tone === "dark" ? "mt-1 text-sm text-neutral-300" : "mt-1 text-sm text-neutral-600 dark:text-neutral-400"}>
            {subtitle}
          </p>
        )}
      </div>
      <Link href={cta.href} className="shrink-0">
        <Button variant={tone === "dark" ? "outline" : "primary"} className={tone === "dark" ? "border-white/30 bg-transparent text-white hover:bg-white/10" : undefined}>
          {cta.label}
        </Button>
      </Link>
    </section>
  );
}
