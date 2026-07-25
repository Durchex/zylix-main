import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div>
        {label && <Label htmlFor={textareaId}>{label}</Label>}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          className={cn(
            "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-neutral-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
            error ? "border-error" : "border-neutral-300",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-error">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-sm text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
