import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // High-contrast orange for purchase actions (Add to Cart, Buy Now,
        // Place order) — matches the dense-catalog convention where the CTA
        // color is deliberately distinct from the nav/link blue, not a
        // decorative gradient.
        primary: "bg-cta-600 text-white hover:bg-cta-700",
        secondary: "bg-ink-900 text-white hover:bg-ink-800 dark:bg-surface-800 dark:hover:bg-surface-700",
        outline:
          "border border-neutral-300 bg-white text-ink-900 hover:bg-neutral-50 dark:border-surface-700 dark:bg-transparent dark:text-neutral-100 dark:hover:bg-surface-800",
        ghost: "text-ink-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-surface-800",
        destructive: "bg-error text-white hover:bg-error/90",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <Spinner className="h-4 w-4" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
