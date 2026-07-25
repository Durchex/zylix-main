import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const alertVariants = cva("rounded-xl border p-4 text-sm", {
  variants: {
    variant: {
      neutral: "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-surface-700 dark:bg-surface-900 dark:text-neutral-200",
      success: "border-success/20 bg-success-subtle text-success dark:bg-success/10",
      warning: "border-warning/20 bg-warning-subtle text-warning dark:bg-warning/10",
      error: "border-error/20 bg-error-subtle text-error dark:bg-error/10",
      info: "border-info/20 bg-info-subtle text-info dark:bg-info/10",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

export function Alert({ className, variant, title, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
