"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Rivers",
  "Oyo",
  "Kano",
  "Enugu",
  "Delta",
  "Ogun",
];

const shippingFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  line1: z.string().trim().min(1, "Address is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormValues>({ resolver: zodResolver(shippingFormSchema) });

  const [saving, setSaving] = useState(false);

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Your cart is empty</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">Add items to your cart before checking out.</p>
        <Button className="mt-6" onClick={() => router.push("/shop")}>
          Browse products
        </Button>
      </Container>
    );
  }

  function onSubmit(values: ShippingFormValues) {
    setSaving(true);
    sessionStorage.setItem("zylix-checkout-address", JSON.stringify(values));
    router.push("/checkout/payment");
  }

  const currency = items[0]?.currency ?? "NGN";

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form
          className="space-y-4 lg:col-span-2"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <h2 className="font-semibold text-ink-900 dark:text-neutral-100">Shipping Address</h2>
          <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
          <Input label="Phone number" error={errors.phone?.message} {...register("phone")} />
          <Input label="Address line 1" error={errors.line1?.message} {...register("line1")} />
          <Input label="Address line 2 (optional)" {...register("line2")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" error={errors.city?.message} {...register("city")} />
            <Select label="State" error={errors.state?.message} {...register("state")}>
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="w-full" isLoading={saving}>
            Continue to payment
          </Button>
        </form>

        <Card className="h-fit">
          <CardBody className="space-y-3">
            <h2 className="font-semibold text-ink-900 dark:text-neutral-100">Order Summary</h2>
            {items.map((item) => (
              <div key={`${item.productId}:${item.variantId}`} className="flex justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-ink-900 dark:text-neutral-100">
                  {formatPrice(item.unitPrice * item.quantity, item.currency)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-surface-800">
              <span className="text-ink-900 dark:text-neutral-100">Subtotal</span>
              <span className="text-ink-900 dark:text-neutral-100">{formatPrice(subtotal, currency)}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
