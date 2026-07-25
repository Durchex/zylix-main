"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthUser } from "@/types/user";

const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);
    try {
      const result = await apiRequest<
        { requiresTwoFactor: true } | { user: AuthUser; accessToken: string }
      >("/auth/login", { method: "POST", body: values });

      if ("requiresTwoFactor" in result) {
        setNeedsTwoFactor(true);
        return;
      }

      setSession(result.user, result.accessToken);
      router.replace(searchParams.get("next") ?? "/");
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <Container className="flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-600">Zylix</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">Welcome back</h1>
      <p className="mt-2 text-neutral-600">
        New to Zylix?{" "}
        <Link href="/auth/register" className="font-medium text-brand-600 underline underline-offset-2">
          Create an account
        </Link>
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {submitError && <Alert variant="error">{submitError}</Alert>}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          disabled={needsTwoFactor}
          error={errors.email?.message}
          {...register("email")}
        />
        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            disabled={needsTwoFactor}
            error={errors.password?.message}
            {...register("password")}
          />
          <Link
            href="/auth/forgot-password"
            className="mt-1.5 inline-block text-sm text-brand-600 underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>

        {needsTwoFactor && (
          <Input
            label="Two-factor code"
            inputMode="numeric"
            maxLength={6}
            helperText="Enter the 6-digit code from your authenticator app."
            autoFocus
            {...register("twoFactorCode")}
          />
        )}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {needsTwoFactor ? "Verify and log in" : "Log in"}
        </Button>
      </form>
    </Container>
  );
}
