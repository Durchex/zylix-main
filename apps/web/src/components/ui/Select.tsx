import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div>
        {label && <Label htmlFor={selectId}>{label}</Label>}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900",
            "dark:bg-surface-900 dark:text-neutral-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950",
            error ? "border-error" : "border-neutral-300 dark:border-surface-700",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
