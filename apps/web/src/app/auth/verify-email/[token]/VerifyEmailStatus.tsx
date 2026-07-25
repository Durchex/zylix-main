"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

export function VerifyEmailStatus({ token }: { token: string }) {
  const [state, setState] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiRequest("/auth/verify-email", { method: "POST", body: { token } })
      .then(() => {
        if (!cancelled) setState("success");
      })
      .catch((err) => {
        if (!cancelled) {
          setState("error");
          setErrorMessage(err instanceof ApiRequestError ? err.message : "Verification failed.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Container className="flex min-h-[70vh] max-w-md flex-col justify-center py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-600">Zylix</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">Email verification</h1>

      <div className="mt-8">
        {state === "pending" && (
          <div className="flex items-center gap-3 text-neutral-600">
            <Spinner className="h-5 w-5" />
            Verifying your email…
          </div>
        )}
        {state === "success" && (
          <Alert variant="success" title="Email verified">
            Your account is now active.{" "}
            <Link href="/auth/login" className="font-medium underline underline-offset-2">
              Log in
            </Link>{" "}
            to continue.
          </Alert>
        )}
        {state === "error" && <Alert variant="error" title="Verification failed">{errorMessage}</Alert>}
      </div>
    </Container>
  );
}
