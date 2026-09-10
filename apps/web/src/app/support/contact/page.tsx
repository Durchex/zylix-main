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
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL_HREF, whatsAppHref } from "@/lib/contact";

const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema) });

  async function onSubmit(values: ContactFormValues) {
    setSubmitError(null);
    try {
      await apiRequest("/support/contact", { method: "POST", body: values });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <Container className="max-w-2xl py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Contact Us</h1>
      <p className="mt-2 text-neutral-600">
        Have a question about an order or product? Reach us on WhatsApp or by phone for the
        quickest answer, or send a message below.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a
          href={whatsAppHref("Hi ZylixStore, I have a question about")}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-brand-300 hover:bg-neutral-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.6.8-.8 1-.3.2-.6.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3A3 3 0 006 10a5.2 5.2 0 001.1 2.7 11.9 11.9 0 004.6 4 5.3 5.3 0 002.4.5 2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.6-.3z" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink-900">Chat on WhatsApp</span>
            <span className="block text-sm text-neutral-500">{SUPPORT_PHONE_DISPLAY}</span>
          </span>
        </a>

        <a
          href={SUPPORT_TEL_HREF}
          className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-brand-300 hover:bg-neutral-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 3h3l1.5 4-2 1.5a11 11 0 005 5L13 11.5 17 13v3a1 1 0 01-1.1 1A14 14 0 013 4.1 1 1 0 014 3z" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink-900">Call us</span>
            <span className="block text-sm text-neutral-500">{SUPPORT_PHONE_DISPLAY}</span>
          </span>
        </a>
      </div>

      {submitted ? (
        <Alert variant="success" title="Message sent" className="mt-8">
          Thanks for reaching out — our support team will get back to you shortly.
        </Alert>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {submitError && <Alert variant="error">{submitError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Your name" error={errors.name?.message} {...register("name")} />
            <Input
              label="Email address"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
          <Input label="Subject" error={errors.subject?.message} {...register("subject")} />
          <Textarea
            label="Message"
            rows={6}
            error={errors.message?.message}
            {...register("message")}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Send message
          </Button>
        </form>
      )}
    </Container>
  );
}
