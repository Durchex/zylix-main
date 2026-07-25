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

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

const registerFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  password: passwordRules,
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setSubmitError(null);
    try {
      await apiRequest("/auth/register", { method: "POST", body: values });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  if (submitted) {
    return (
      <Container className="flex min-h-[70vh] max-w-md flex-col justify-center py-16">
        <Alert variant="success" title="Check your inbox">
          We&apos;ve sent a verification link to your email. Verify your address to activate
          your account, then{" "}
          <Link href="/auth/login" className="font-medium underline underline-offset-2">
            log in
          </Link>
          .
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-600">Zylix</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">Create your account</h1>
      <p className="mt-2 text-neutral-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-brand-600 underline underline-offset-2">
          Log in
        </Link>
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {submitError && <Alert variant="error">{submitError}</Alert>}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          helperText="At least 8 characters, with upper, lower, and a number."
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </Container>
  );
}
