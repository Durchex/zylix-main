"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils";
import { adminShippingApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminShippingZone } from "@/types/admin";
import {
  ShippingZoneFormDialog,
  type ShippingZoneSubmitValues,
} from "@/app/admin/shipping/ShippingZoneFormDialog";

export default function AdminShippingPage() {
  const [zones, setZones] = useState<AdminShippingZone[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<AdminShippingZone | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(() => {
    adminShippingApi
      .list()
      .then((res) => {
        setError(null);
        setZones(res.zones);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingZone(null);
    setSubmitError(null);
    setDialogOpen(true);
  }

  function openEdit(zone: AdminShippingZone) {
    setEditingZone(zone);
    setSubmitError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(values: ShippingZoneSubmitValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (editingZone) {
        await adminShippingApi.update(editingZone.id, values);
      } else {
        await adminShippingApi.create(values);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(zone: AdminShippingZone) {
    if (!confirm(`Delete "${zone.name}"? This cannot be undone.`)) return;
    try {
      await adminShippingApi.remove(zone.id);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Shipping Zones</h1>
        <Button onClick={openCreate}>Add zone</Button>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Delivery fees and estimates shown at checkout, matched against the customer&apos;s state.
      </p>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!zones ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">
            No shipping zones yet — checkout falls back to free shipping until you add one.
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">States</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Free above</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    <div className="flex items-center gap-2">
                      {zone.name}
                      {zone.isDefault && <Badge variant="brand">Fallback</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{zone.states.join(", ")}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatPrice(Number(zone.fee), "NGN")}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {zone.freeShippingThreshold ? formatPrice(Number(zone.freeShippingThreshold), "NGN") : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {zone.estimatedDaysMin}–{zone.estimatedDaysMax} days
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(zone)}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(zone)}
                        className="text-sm font-medium text-error hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ShippingZoneFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        zone={editingZone}
        submitError={submitError}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
