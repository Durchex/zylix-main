"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { AddressAutocomplete, type ResolvedPlace } from "@/components/address/AddressAutocomplete";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

interface StoreSettings {
  id: string;
  pickupName: string | null;
  pickupEmail: string | null;
  pickupPhone: string | null;
  pickupAddress: string | null;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  pickupAddressCode: number | null;
  defaultLengthCm: number;
  defaultWidthCm: number;
  defaultHeightCm: number;
  defaultWeightKg: number;
  shipbubbleCategoryId: number | null;
}

interface Category {
  categoryId: number;
  category: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [shipbubbleConfigured, setShipbubbleConfigured] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Coordinates only change when a Places suggestion is picked; typing the
  // address by hand leaves whatever was stored before.
  const [geo, setGeo] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    apiRequest<{ settings: StoreSettings; shipbubbleConfigured: boolean }>("/admin/settings")
      .then((res) => {
        setSettings(res.settings);
        setShipbubbleConfigured(res.shipbubbleConfigured);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));

    apiRequest<{ categories: Category[] }>("/admin/settings/shipbubble-categories")
      .then((res) => setCategories(res.categories))
      // No categories just means the dropdown stays empty; not worth an alert.
      .catch(() => undefined);
  }, []);

  function field<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  function applyPlace(place: ResolvedPlace) {
    field("pickupAddress", place.formattedAddress);
    if (place.latitude != null && place.longitude != null) {
      setGeo({ latitude: place.latitude, longitude: place.longitude });
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await apiRequest<{ settings: StoreSettings }>("/admin/settings", {
        method: "PATCH",
        body: {
          pickupName: settings.pickupName ?? undefined,
          pickupEmail: settings.pickupEmail ?? "",
          pickupPhone: settings.pickupPhone ?? undefined,
          pickupAddress: settings.pickupAddress ?? undefined,
          // A freshly picked place wins; otherwise keep whatever coordinates
          // were already stored so hand-editing the text doesn't drop them.
          pickupLatitude: geo?.latitude ?? settings.pickupLatitude ?? undefined,
          pickupLongitude: geo?.longitude ?? settings.pickupLongitude ?? undefined,
          defaultLengthCm: settings.defaultLengthCm,
          defaultWidthCm: settings.defaultWidthCm,
          defaultHeightCm: settings.defaultHeightCm,
          defaultWeightKg: settings.defaultWeightKg,
          ...(settings.shipbubbleCategoryId
            ? { shipbubbleCategoryId: settings.shipbubbleCategoryId }
            : {}),
        },
      });
      setSettings(res.settings);
      setGeo(null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const readyForRates = Boolean(settings.pickupAddressCode && settings.shipbubbleCategoryId);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Delivery settings</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Where parcels ship from, and the defaults used to quote couriers.
      </p>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}
      {saved && (
        <Alert variant="success" className="mt-4">
          Settings saved.
        </Alert>
      )}

      {!shipbubbleConfigured && (
        <Alert variant="warning" className="mt-4">
          Shipbubble isn&rsquo;t configured on this environment, so checkout falls back to the
          flat-rate shipping zones. Add <code>SHIPBUBBLE_API_KEY</code> to enable live courier
          rates.
        </Alert>
      )}
      {shipbubbleConfigured && !readyForRates && (
        <Alert variant="warning" className="mt-4">
          Courier rates stay off until a validated pickup address and a package category are both
          set below.
        </Alert>
      )}

      <Card className="mt-6">
        <CardHeader>
          <p className="font-semibold text-ink-900">Pickup address</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-neutral-500">
            Couriers collect from here. Changing it re-validates the address with Shipbubble.
          </p>

          <AddressAutocomplete
            label="Search for your pickup address"
            onSelect={applyPlace}
            initialValue={settings.pickupAddress ?? ""}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contact name"
              value={settings.pickupName ?? ""}
              onChange={(e) => field("pickupName", e.target.value)}
            />
            <Input
              label="Contact phone"
              value={settings.pickupPhone ?? ""}
              onChange={(e) => field("pickupPhone", e.target.value)}
            />
          </div>
          <Input
            label="Contact email"
            type="email"
            value={settings.pickupEmail ?? ""}
            onChange={(e) => field("pickupEmail", e.target.value)}
          />
          <Input
            label="Full address"
            helperText="Include the street, area, state and country."
            value={settings.pickupAddress ?? ""}
            onChange={(e) => field("pickupAddress", e.target.value)}
          />

          {settings.pickupAddressCode && (
            <p className="text-xs text-success">
              Validated with Shipbubble (address code {settings.pickupAddressCode}).
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <p className="font-semibold text-ink-900">Default parcel</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-neutral-500">
            Used to quote any product that doesn&rsquo;t have its own dimensions or weight set.
          </p>
          <div className="grid gap-4 sm:grid-cols-4">
            <Input
              label="Length (cm)"
              type="number"
              value={settings.defaultLengthCm}
              onChange={(e) => field("defaultLengthCm", Number(e.target.value))}
            />
            <Input
              label="Width (cm)"
              type="number"
              value={settings.defaultWidthCm}
              onChange={(e) => field("defaultWidthCm", Number(e.target.value))}
            />
            <Input
              label="Height (cm)"
              type="number"
              value={settings.defaultHeightCm}
              onChange={(e) => field("defaultHeightCm", Number(e.target.value))}
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={settings.defaultWeightKg}
              onChange={(e) => field("defaultWeightKg", Number(e.target.value))}
            />
          </div>

          <Select
            label="Shipbubble package category"
            value={settings.shipbubbleCategoryId ?? ""}
            onChange={(e) => field("shipbubbleCategoryId", Number(e.target.value))}
            helperText={
              categories.length === 0
                ? "Categories load from Shipbubble once an API key is configured."
                : "Declared to couriers for every shipment."
            }
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.category}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Button className="mt-6" onClick={handleSave} isLoading={saving}>
        Save settings
      </Button>
    </div>
  );
}
