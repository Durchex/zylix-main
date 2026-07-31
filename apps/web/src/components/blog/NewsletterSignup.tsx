"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

const newsletterFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

type NewsletterFormValues = z.infer<typeof newsletterFormSchema>;

export function NewsletterSignup() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormValues>({ resolver: zodResolver(newsletterFormSchema) });

  async function onSubmit(values: NewsletterFormValues) {
    setSubmitError(null);
    try {
      await apiRequest("/newsletter/subscribe", { method: "POST", body: values });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <section className="rounded-2xl bg-ink-900 px-6 py-10 text-center text-white dark:bg-surface-900">
      <h2 className="text-xl font-bold sm:text-2xl">Get buying guides in your inbox</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-300">
        Weekly tech tips, product comparisons, and deal alerts — no spam.
      </p>

      {submitted ? (
        <Alert variant="success" className="mx-auto mt-6 max-w-sm text-left">
          Subscribed — check your inbox for a confirmation.
        </Alert>
      ) : (
        <form
          className="mx-auto mt-6 flex max-w-sm flex-col gap-3 sm:flex-row sm:items-start"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="flex-1 text-left">
            <Input
              type="email"
              placeholder="you@example.com"
              aria-label="Email address"
              error={errors.email?.message}
              className="bg-white"
              {...register("email")}
            />
          </div>
          <Button type="submit" isLoading={isSubmitting} className="shrink-0">
            Subscribe
          </Button>
        </form>
      )}
      {submitError && <p className="mx-auto mt-3 max-w-sm text-sm text-red-300">{submitError}</p>}
    </section>
  );
}
