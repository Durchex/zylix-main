"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { AdminShippingZone } from "@/types/admin";

const shippingZoneFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    statesText: z.string().trim().min(1, "List at least one state, comma-separated"),
    fee: z.coerce.number().nonnegative("Fee must be zero or more"),
    freeShippingThreshold: z.string().trim().optional(),
    estimatedDaysMin: z.coerce.number().int().positive("Enter a whole number of days"),
    estimatedDaysMax: z.coerce.number().int().positive("Enter a whole number of days"),
    isDefault: z.boolean().default(false),
  })
  .refine((data) => data.estimatedDaysMax >= data.estimatedDaysMin, {
    message: "Max days must be ≥ min days",
    path: ["estimatedDaysMax"],
  });

export type ShippingZoneFormValues = z.infer<typeof shippingZoneFormSchema>;

export type ShippingZoneSubmitValues = {
  name: string;
  states: string[];
  fee: number;
  freeShippingThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isDefault: boolean;
};

export function ShippingZoneFormDialog({
  open,
  onClose,
  onSubmit,
  zone,
  submitError,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ShippingZoneSubmitValues) => void;
  zone: AdminShippingZone | null;
  submitError: string | null;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShippingZoneFormValues>({ resolver: zodResolver(shippingZoneFormSchema) });

  useEffect(() => {
    if (open) {
      reset(
        zone
          ? {
              name: zone.name,
              statesText: zone.states.join(", "),
              fee: Number(zone.fee),
              freeShippingThreshold:
                zone.freeShippingThreshold !== null ? String(Number(zone.freeShippingThreshold)) : "",
              estimatedDaysMin: zone.estimatedDaysMin,
              estimatedDaysMax: zone.estimatedDaysMax,
              isDefault: zone.isDefault,
            }
          : {
              name: "",
              statesText: "",
              fee: 0,
              freeShippingThreshold: "",
              estimatedDaysMin: 1,
              estimatedDaysMax: 3,
              isDefault: false,
            },
      );
    }
  }, [open, zone, reset]);

  function handleFormSubmit(values: ShippingZoneFormValues) {
    onSubmit({
      name: values.name,
      states: values.statesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      fee: values.fee,
      freeShippingThreshold:
        values.freeShippingThreshold && values.freeShippingThreshold !== ""
          ? Number(values.freeShippingThreshold)
          : null,
      estimatedDaysMin: values.estimatedDaysMin,
      estimatedDaysMax: values.estimatedDaysMax,
      isDefault: values.isDefault,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title={zone ? "Edit Shipping Zone" : "Add Shipping Zone"}>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
        {submitError && <Alert variant="error">{submitError}</Alert>}
        <Input label="Zone name" error={errors.name?.message} {...register("name")} />
        <Input
          label="States covered"
          placeholder="Lagos, Ogun"
          helperText="Comma-separated state names, matched exactly against the customer's shipping address."
          error={errors.statesText?.message}
          {...register("statesText")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Delivery fee (₦)"
            type="number"
            step="0.01"
            error={errors.fee?.message}
            {...register("fee")}
          />
          <Input
            label="Free shipping above (₦, optional)"
            type="number"
            step="0.01"
            placeholder="No threshold"
            error={errors.freeShippingThreshold?.message}
            {...register("freeShippingThreshold")}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min delivery days"
            type="number"
            error={errors.estimatedDaysMin?.message}
            {...register("estimatedDaysMin")}
          />
          <Input
            label="Max delivery days"
            type="number"
            error={errors.estimatedDaysMax?.message}
            {...register("estimatedDaysMax")}
          />
        </div>
        <Checkbox
          label="Fallback zone (used for any state not listed above)"
          {...register("isDefault")}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {zone ? "Save changes" : "Create zone"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
