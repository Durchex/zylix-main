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
        Have a question about an order or product? Send us a message and we&rsquo;ll respond as
        soon as possible.
      </p>

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
