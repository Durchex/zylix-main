import { useId } from "react";
import { cn } from "@/lib/utils";

function Star({
  filled,
  half,
  gradientId,
}: {
  filled: boolean;
  half?: boolean;
  gradientId: string;
}) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      {half && (
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.75.99-5.8-4.21-4.1 5.82-.85z"
        fill={half ? `url(#${gradientId})` : filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
        className={filled || half ? "text-accent-500 dark:text-accent-400" : "text-neutral-300 dark:text-surface-700"}
      />
    </svg>
  );
}

export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  const baseId = useId();

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starIndex = i + 1;
    const filled = value >= starIndex;
    const half = !filled && value > starIndex - 1;
    return <Star key={i} filled={filled} half={half} gradientId={`${baseId}-star-${i}`} />;
  });

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`Rated ${value} out of 5`}
    >
      <div className="flex">{stars}</div>
      {typeof count === "number" && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
