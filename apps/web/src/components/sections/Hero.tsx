import Link from "next/link";
import { Button } from "@/components/ui/Button";

export interface HeroCta {
  label: string;
  href: string;
  variant?: "primary" | "outline";
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  ctas,
  breadcrumb,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctas?: HeroCta[];
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <section className="flex flex-col items-start gap-3 border-b border-neutral-200 py-6 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
            {breadcrumb.map((crumb, index) => (
              <span key={crumb.label}>
                {index > 0 && " / "}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-ink-900 dark:hover:text-neutral-100">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-ink-900 dark:text-neutral-100">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-accent-400">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-xl font-bold text-ink-900 dark:text-neutral-50 sm:text-2xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">{subtitle}</p>
        )}
      </div>
      {ctas && ctas.length > 0 && (
        <div className="flex shrink-0 gap-2">
          {ctas.map((cta) => (
            <Link key={cta.label} href={cta.href}>
              <Button variant={cta.variant ?? "primary"}>{cta.label}</Button>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
