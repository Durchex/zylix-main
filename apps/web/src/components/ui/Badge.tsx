import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-neutral-100 text-neutral-700 dark:bg-surface-800 dark:text-neutral-300",
        brand: "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-accent-300",
        success: "bg-success-subtle text-success dark:bg-success/15",
        warning: "bg-warning-subtle text-warning dark:bg-warning/15",
        error: "bg-error-subtle text-error dark:bg-error/15",
        info: "bg-info-subtle text-info dark:bg-info/15",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
