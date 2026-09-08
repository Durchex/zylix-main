"use client";

import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

/**
 * Newsletter signup, wired to POST /api/v1/newsletter/subscribe — the
 * endpoint already existed but had no UI reaching it.
 */
export function NewsletterBar() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      await apiRequest("/newsletter/subscribe", { method: "POST", body: { email } });
      setStatus("done");
      setEmail("");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Container className="py-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-brand px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-white">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Stay Updated</h2>
            <p className="mt-1 text-sm text-white/80">
              Be the first to know about new arrivals, exclusive deals and more.
            </p>
          </div>

          <div className="w-full max-w-md">
            {status === "done" ? (
              <p className="rounded-xl bg-white/15 px-4 py-3 text-sm font-medium text-white">
                You&rsquo;re subscribed — thanks for joining.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  className="h-11 w-full rounded-xl border-0 bg-white px-4 text-sm text-ink-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                />
                <Button
                  type="submit"
                  isLoading={status === "loading"}
                  className="shrink-0 bg-secondary-900 hover:bg-secondary-950"
                >
                  Subscribe
                </Button>
              </form>
            )}
            {error && <p className="mt-2 text-sm text-white">{error}</p>}
          </div>
        </div>
      </section>
    </Container>
  );
}
