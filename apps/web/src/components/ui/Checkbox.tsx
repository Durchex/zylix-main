import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
      <label htmlFor={checkboxId} className="inline-flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-neutral-300 text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-surface-700 dark:bg-surface-900 dark:focus-visible:ring-offset-surface-950",
            className,
          )}
          {...props}
        />
        {label}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
