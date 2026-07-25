"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatPrice, cn } from "@/lib/utils";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

const AMOUNT_PRESETS = [5000, 10000, 25000, 50000, 100000];

const giftCardFormSchema = z.object({
  amount: z.number().min(1000, "Minimum gift card amount is ₦1,000"),
  recipientEmail: z.string().trim().email("Enter a valid email address"),
  senderName: z.string().trim().min(1, "Your name is required"),
  message: z.string().trim().max(300).optional(),
});

type GiftCardFormValues = z.infer<typeof giftCardFormSchema>;

export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState(AMOUNT_PRESETS[2]!);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GiftCardFormValues>({
    resolver: zodResolver(giftCardFormSchema),
    defaultValues: { amount: selectedAmount },
  });

  function selectAmount(amount: number) {
    setSelectedAmount(amount);
    setValue("amount", amount, { shouldValidate: true });
  }

  async function onSubmit(values: GiftCardFormValues) {
    setSubmitError(null);
    try {
      await apiRequest("/gift-cards", { method: "POST", body: values });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  if (submitted) {
    return (
      <Container className="max-w-lg py-16">
        <Alert variant="success" title="Gift card purchase started">
          We&rsquo;ll email the recipient a redeemable gift card once payment is confirmed.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="max-w-lg py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Gift Cards</h1>
      <p className="mt-2 text-neutral-600">
        Send a Zylix gift card — redeemable on any purchase, never expires.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {submitError && <Alert variant="error">{submitError}</Alert>}

        <div>
          <p className="mb-2 text-sm font-medium text-neutral-800">Amount</p>
          <div className="flex flex-wrap gap-2">
            {AMOUNT_PRESETS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => selectAmount(amount)}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm font-medium",
                  selectedAmount === amount
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-neutral-300 text-neutral-700 hover:border-brand-300",
                )}
              >
                {formatPrice(amount)}
              </button>
            ))}
          </div>
          {errors.amount && <p className="mt-1.5 text-sm text-error">{errors.amount.message}</p>}
        </div>

        <Input
          label="Recipient email"
          type="email"
          error={errors.recipientEmail?.message}
          {...register("recipientEmail")}
        />
        <Input label="Your name" error={errors.senderName?.message} {...register("senderName")} />
        <Textarea
          label="Personal message (optional)"
          rows={3}
          error={errors.message?.message}
          {...register("message")}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Continue to payment
        </Button>
      </form>
    </Container>
  );
}
