"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

export function UnsubscribeStatus() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [requestState, setRequestState] = useState<"pending" | "success" | "error">("pending");
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;

    let cancelled = false;
    apiRequest("/newsletter/unsubscribe", { method: "POST", body: { email } })
      .then(() => {
        if (!cancelled) setRequestState("success");
      })
      .catch((err) => {
        if (!cancelled) {
          setRequestState("error");
          setRequestErrorMessage(
            err instanceof ApiRequestError ? err.message : "Something went wrong.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [email]);

  const state = !email ? "error" : requestState;
  const errorMessage = !email ? "No email address was provided." : requestErrorMessage;

  return (
    <Container className="flex min-h-[50vh] max-w-md flex-col justify-center py-16">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Newsletter Preferences</h1>
      <div className="mt-6">
        {state === "pending" && (
          <div className="flex items-center gap-3 text-neutral-600">
            <Spinner className="h-5 w-5" />
            Updating your preferences…
          </div>
        )}
        {state === "success" && (
          <Alert variant="success" title="You've been unsubscribed">
            You won&rsquo;t receive marketing emails from Zylix going forward. You&rsquo;ll still
            get order and account notifications.
          </Alert>
        )}
        {state === "error" && <Alert variant="error" title="Something went wrong">{errorMessage}</Alert>}
      </div>
    </Container>
  );
}
