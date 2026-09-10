"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { AddressAutocomplete, type ResolvedPlace } from "@/components/address/AddressAutocomplete";
import { apiRequest } from "@/lib/api-client";
import { formatPrice, cn } from "@/lib/utils";
import { writeCheckoutAddress } from "@/lib/checkout";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";

const shippingFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email address"),
  line1: z.string().trim().min(1, "Address is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  // Free text rather than a fixed list — Places fills it, and the previous
  // 8-state dropdown couldn't represent most of the country.
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().optional(),
  saveToAddressBook: z.boolean().default(false),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

interface SavedAddress {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const user = useAuthStore((s) => s.user);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  // null = "enter a new address"; otherwise the chosen saved address id.
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [geo, setGeo] = useState<{ latitude: number; longitude: number; placeId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: { email: user?.email ?? "", saveToAddressBook: false },
  });

  useEffect(() => {
    if (!user) return;
    apiRequest<{ addresses: SavedAddress[] }>("/addresses")
      .then((res) => {
        setSavedAddresses(res.addresses);
        const preferred = res.addresses.find((a) => a.isDefault) ?? res.addresses[0];
        if (preferred) setSelectedAddressId(preferred.id);
      })
      // No saved addresses is the normal case for a first order.
      .catch(() => undefined);
  }, [user]);

  function applyPlace(place: ResolvedPlace) {
    setValue("line1", place.line1, { shouldValidate: true });
    setValue("city", place.city, { shouldValidate: true });
    setValue("state", place.state, { shouldValidate: true });
    if (place.postalCode) setValue("postalCode", place.postalCode);
    if (place.latitude != null && place.longitude != null) {
      setGeo({ latitude: place.latitude, longitude: place.longitude, placeId: place.placeId });
    }
  }

  function continueWithSaved() {
    if (!selectedAddressId) return;
    setError(null);
    setSaving(true);
    writeCheckoutAddress({ addressId: selectedAddressId });
    router.push("/checkout/payment");
  }

  function onSubmit(values: ShippingFormValues) {
    setError(null);
    setSaving(true);
    writeCheckoutAddress({ shippingAddress: { ...values, country: "Nigeria", ...geo } });
    router.push("/checkout/payment");
  }

  if (items.length === 0) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">
          Your cart is empty
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Add items to your cart before checking out.
        </p>
        <Button className="mt-6" onClick={() => router.push("/shop")}>
          Browse products
        </Button>
      </Container>
    );
  }

  const currency = items[0]?.currency ?? "NGN";
  const usingNewAddress = selectedAddressId === null;

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Checkout</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Step 1 of 2 — where should we deliver?
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {error && <Alert variant="error">{error}</Alert>}

          {savedAddresses.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-ink-900 dark:text-neutral-100">
                Deliver to a saved address
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {savedAddresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => setSelectedAddressId(address.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-colors",
                      selectedAddressId === address.id
                        ? "border-brand-600 bg-brand-50 dark:bg-surface-800"
                        : "border-neutral-200 hover:border-brand-300 dark:border-surface-800",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900 dark:text-neutral-100">
                        {address.label ?? address.fullName}
                      </span>
                      {address.isDefault && (
                        <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">
                      {[address.line1, address.city, address.state].filter(Boolean).join(", ")}
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-400">{address.phone}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setSelectedAddressId(null)}
                  className={cn(
                    "rounded-2xl border border-dashed p-4 text-left text-sm font-medium transition-colors",
                    usingNewAddress
                      ? "border-brand-600 text-brand-700 dark:text-accent-400"
                      : "border-neutral-300 text-neutral-600 hover:border-brand-300 dark:border-surface-700 dark:text-neutral-400",
                  )}
                >
                  + Use a new address
                </button>
              </div>

              {!usingNewAddress && (
                <Button className="mt-4 w-full" isLoading={saving} onClick={continueWithSaved}>
                  Continue to delivery options
                </Button>
              )}
            </div>
          )}

          {usingNewAddress && (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <h2 className="font-semibold text-ink-900 dark:text-neutral-100">Shipping Address</h2>

              <AddressAutocomplete onSelect={applyPlace} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
                <Input label="Phone number" error={errors.phone?.message} {...register("phone")} />
              </div>
              <Input
                label="Email address"
                type="email"
                helperText="Used for delivery updates from the courier."
                error={errors.email?.message}
                {...register("email")}
              />
              <Input label="Address line 1" error={errors.line1?.message} {...register("line1")} />
              <Input label="Address line 2 (optional)" {...register("line2")} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="City" error={errors.city?.message} {...register("city")} />
                <Input label="State" error={errors.state?.message} {...register("state")} />
                <Input label="Postal code (optional)" {...register("postalCode")} />
              </div>

              {user && (
                <Checkbox label="Save this address for next time" {...register("saveToAddressBook")} />
              )}

              <Button type="submit" className="w-full" isLoading={saving}>
                Continue to delivery options
              </Button>
            </form>
          )}
        </div>

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
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Delivery is quoted on the next step, once we know where it&rsquo;s going.
            </p>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
