"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

const trackingFormSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required"),
  email: z.string().trim().email("Enter a valid email address"),
});

type TrackingFormValues = z.infer<typeof trackingFormSchema>;

interface OrderStatusResult {
  orderNumber: string;
  status: string;
  placedAt: string;
  estimatedDelivery: string | null;
}

export default function OrderTrackingPage() {
  const [result, setResult] = useState<OrderStatusResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrackingFormValues>({ resolver: zodResolver(trackingFormSchema) });

  async function onSubmit(values: TrackingFormValues) {
    setSubmitError(null);
    setResult(null);
    try {
      const data = await apiRequest<{ order: OrderStatusResult }>(
        `/orders/track?orderNumber=${encodeURIComponent(values.orderNumber)}&email=${encodeURIComponent(values.email)}`,
      );
      setResult(data.order);
    } catch (err) {
      setSubmitError(
        err instanceof ApiRequestError
          ? err.message
          : "We couldn't find an order matching those details.",
      );
    }
  }

  return (
    <Container className="max-w-lg py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Track Your Order</h1>
      <p className="mt-2 text-neutral-600">
        Enter your order number and the email used at checkout.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {submitError && <Alert variant="error">{submitError}</Alert>}
        <Input
          label="Order number"
          placeholder="ZLX-10234"
          error={errors.orderNumber?.message}
          {...register("orderNumber")}
        />
        <Input
          label="Email address"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Track order
        </Button>
      </form>

      {result && (
        <div className="mt-8 rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink-900">{result.orderNumber}</p>
            <Badge variant="brand">{result.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            Placed {new Date(result.placedAt).toLocaleDateString("en-NG")}
          </p>
          {result.estimatedDelivery && (
            <p className="mt-1 text-sm text-neutral-500">
              Estimated delivery {new Date(result.estimatedDelivery).toLocaleDateString("en-NG")}
            </p>
          )}
        </div>
      )}
    </Container>
  );
}
