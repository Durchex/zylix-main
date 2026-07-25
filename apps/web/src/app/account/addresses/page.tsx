"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import type { Address } from "@/types/address";

const addressFormSchema = z.object({
  label: z.string().trim().max(50).optional().or(z.literal("")),
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  line1: z.string().trim().min(1, "Address line is required"),
  line2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  country: z.string().trim().min(1, "Country is required"),
  postalCode: z.string().trim().optional().or(z.literal("")),
  type: z.enum(["SHIPPING", "BILLING"]),
  isDefault: z.boolean(),
});
type AddressFormValues = z.infer<typeof addressFormSchema>;

const EMPTY_FORM: AddressFormValues = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "Nigeria",
  postalCode: "",
  type: "SHIPPING",
  isDefault: false,
};

function cleanValues(values: AddressFormValues) {
  return {
    ...values,
    label: values.label || undefined,
    line2: values.line2 || undefined,
    postalCode: values.postalCode || undefined,
  };
}

function AddressForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues: AddressFormValues;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressFormSchema), defaultValues });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input label="Label (optional)" placeholder="Home, Office..." {...register("label")} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
      </div>
      <Input label="Address line 1" error={errors.line1?.message} {...register("line1")} />
      <Input label="Address line 2 (optional)" {...register("line2")} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="City" error={errors.city?.message} {...register("city")} />
        <Input label="State" error={errors.state?.message} {...register("state")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Country" error={errors.country?.message} {...register("country")} />
        <Input label="Postal code (optional)" {...register("postalCode")} />
      </div>
      <Select label="Type" {...register("type")}>
        <option value="SHIPPING">Shipping</option>
        <option value="BILLING">Billing</option>
      </Select>
      <Checkbox label="Set as default address" {...register("isDefault")} />
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

type DialogMode = "closed" | "add" | { edit: Address };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>("closed");

  function load() {
    apiRequest<{ addresses: Address[] }>("/addresses")
      .then((res) => setAddresses(res.addresses))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }

  useEffect(load, []);

  async function handleCreate(values: AddressFormValues) {
    await apiRequest("/addresses", { method: "POST", body: cleanValues(values) });
    setDialogMode("closed");
    load();
  }

  async function handleUpdate(addressId: string, values: AddressFormValues) {
    await apiRequest(`/addresses/${addressId}`, { method: "PATCH", body: cleanValues(values) });
    setDialogMode("closed");
    load();
  }

  async function handleDelete(addressId: string) {
    if (!confirm("Delete this address?")) return;
    await apiRequest(`/addresses/${addressId}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Addresses</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your shipping and billing addresses.</p>
        </div>
        <Button onClick={() => setDialogMode("add")}>Add address</Button>
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {!addresses ? (
          Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
        ) : addresses.length === 0 ? (
          <p className="text-sm text-neutral-500">No addresses saved yet.</p>
        ) : (
          addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader className="flex items-center justify-between">
                <p className="font-semibold text-ink-900">{address.label || address.type}</p>
                <div className="flex gap-2">
                  {address.isDefault && <Badge variant="brand">Default</Badge>}
                  <Badge variant="neutral">{address.type}</Badge>
                </div>
              </CardHeader>
              <CardBody className="space-y-1 text-sm text-neutral-600">
                <p className="text-ink-900">{address.fullName}</p>
                <p>{address.phone}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state}
                </p>
                <p>{address.country}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-600 underline underline-offset-2"
                    onClick={() => setDialogMode({ edit: address })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium text-error underline underline-offset-2"
                    onClick={() => handleDelete(address.id)}
                  >
                    Delete
                  </button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogMode === "add"} onClose={() => setDialogMode("closed")} title="Add address">
        <AddressForm defaultValues={EMPTY_FORM} onSubmit={handleCreate} submitLabel="Add address" />
      </Dialog>

      <Dialog
        open={typeof dialogMode === "object"}
        onClose={() => setDialogMode("closed")}
        title="Edit address"
      >
        {typeof dialogMode === "object" && (
          <AddressForm
            defaultValues={{
              label: dialogMode.edit.label ?? "",
              fullName: dialogMode.edit.fullName,
              phone: dialogMode.edit.phone,
              line1: dialogMode.edit.line1,
              line2: dialogMode.edit.line2 ?? "",
              city: dialogMode.edit.city,
              state: dialogMode.edit.state,
              country: dialogMode.edit.country,
              postalCode: dialogMode.edit.postalCode ?? "",
              type: dialogMode.edit.type,
              isDefault: dialogMode.edit.isDefault,
            }}
            onSubmit={(values) => handleUpdate(dialogMode.edit.id, values)}
            submitLabel="Save changes"
          />
        )}
      </Dialog>
    </div>
  );
}
