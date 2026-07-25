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

const resetPasswordFormSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[0-9]/, "Add a number"),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordFormSchema) });

  async function onSubmit(values: ResetPasswordFormValues) {
    setSubmitError(null);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: { token, password: values.password },
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <Container className="flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-600">Zylix</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">Choose a new password</h1>

      {submitted ? (
        <Alert variant="success" title="Password updated" className="mt-8">
          Your password has been reset.{" "}
          <Link href="/auth/login" className="font-medium underline underline-offset-2">
            Log in
          </Link>{" "}
          with your new password.
        </Alert>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {submitError && <Alert variant="error">{submitError}</Alert>}
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            helperText="At least 8 characters, with upper, lower, and a number."
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset password
          </Button>
        </form>
      )}
    </Container>
  );
}
