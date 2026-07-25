"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

const forgotPasswordFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export default function ForgotPasswordPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordFormSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmitError(null);
    try {
      await apiRequest("/auth/forgot-password", { method: "POST", body: values });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <Container className="flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-600">Zylix</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">Reset your password</h1>
      <p className="mt-2 text-neutral-600">
        Remembered it?{" "}
        <Link href="/auth/login" className="font-medium text-brand-600 underline underline-offset-2">
          Back to login
        </Link>
      </p>

      {submitted ? (
        <Alert variant="success" title="Check your inbox" className="mt-8">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </Alert>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {submitError && <Alert variant="error">{submitError}</Alert>}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </Container>
  );
}
