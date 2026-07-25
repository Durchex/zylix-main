import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-neutral-200 dark:bg-surface-800", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
