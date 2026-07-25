"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Accordion, type AccordionItemData } from "@/components/ui/Accordion";
import { LocationsList } from "@/components/sections/LocationsList";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  subject: z.string().trim().min(1, "Subject is required"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const SUBJECT_OPTIONS = ["Order Issues", "Product Inquiry", "Returns", "General"];

const CONTACT_FAQ: AccordionItemData[] = [
  { question: "How long does it take to hear back?", answer: "Our support team typically responds within 24 hours on business days." },
  { question: "How do I track my order?", answer: "Sign in and visit My Orders, or use Order Tracking with your order number and checkout email." },
  { question: "What's your return policy?", answer: "Most items can be returned within 14 days of delivery if unused and in original packaging." },
  { question: "How do I make a warranty claim?", answer: "Contact us with your order number and a description of the issue — we'll guide you through the manufacturer's process." },
];

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
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Contact Us</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
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
          <Select label="Subject" error={errors.subject?.message} defaultValue="" {...register("subject")}>
            <option value="" disabled>
              Select a subject
            </option>
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
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

      <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-surface-800">
        <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">Other ways to reach us</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-ink-900 dark:text-neutral-100">Support hotline</dt>
            <dd className="text-neutral-600 dark:text-neutral-400">+234 800 000 0000</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-900 dark:text-neutral-100">WhatsApp support</dt>
            <dd className="text-neutral-600 dark:text-neutral-400">+234 800 000 0001</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-900 dark:text-neutral-100">Email</dt>
            <dd className="text-neutral-600 dark:text-neutral-400">support@zylix.com</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-900 dark:text-neutral-100">Live chat & support hours</dt>
            <dd className="text-neutral-600 dark:text-neutral-400">8 AM – 8 PM daily</dd>
          </div>
        </dl>
      </section>

      <LocationsList
        title="Service centers & pickup stations"
        items={[
          { name: "Lagos — Victoria Island", address: "12 Ademola Adetokunbo St, Victoria Island, Lagos", phone: "+234 800 000 0002", hours: "Mon–Sat, 9 AM – 6 PM" },
          { name: "Abuja — Wuse II", address: "45 Aminu Kano Crescent, Wuse II, Abuja", phone: "+234 800 000 0003", hours: "Mon–Sat, 9 AM – 6 PM" },
        ]}
      />

      <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-surface-800">
        <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">Frequently asked questions</h2>
        <Accordion items={CONTACT_FAQ} />
      </section>
    </Container>
  );
}
