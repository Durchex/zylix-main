import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-0.5 text-xl font-bold tracking-tight",
        tone === "dark" ? "text-ink-900" : "text-white",
        className,
      )}
    >
      ZYL
      <span className="text-brand-500">I</span>X
    </span>
  );
}
