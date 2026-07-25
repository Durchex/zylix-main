import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink-900 placeholder:text-neutral-400",
            "dark:bg-surface-900 dark:text-neutral-100 dark:placeholder:text-neutral-500",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950",
            error ? "border-error" : "border-neutral-300 dark:border-surface-700",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
