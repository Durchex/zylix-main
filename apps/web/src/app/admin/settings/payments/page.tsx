"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  provider: string;
  label: string;
  detail: string;
  primary: boolean;
  enabled: boolean;
  configured: boolean;
  available: boolean;
}

interface BankTransfer {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
}

interface PaymentSettings {
  methods: PaymentMethod[];
  bankTransfer: BankTransfer;
}

/** Which env vars a provider needs, so the page can say what's missing. */
const REQUIRED_KEYS: Record<string, string> = {
  FLUTTERWAVE: "FLUTTERWAVE_SECRET_KEY",
  CRYPTO: "NOWPAYMENTS_API_KEY and NOWPAYMENTS_IPN_SECRET",
};

export default function AdminPaymentSettingsPage() {
  const [data, setData] = useState<PaymentSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiRequest<PaymentSettings>("/admin/settings/payments")
      .then(setData)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  function toggle(provider: string) {
    setSaved(false);
    setData((prev) =>
      prev
        ? {
            ...prev,
            methods: prev.methods.map((m) =>
              m.provider === provider
                ? { ...m, enabled: !m.enabled, available: !m.enabled && m.configured }
                : m,
            ),
          }
        : prev,
    );
  }

  function setBankField(field: keyof BankTransfer, value: string) {
    setSaved(false);
    setData((prev) => (prev ? { ...prev, bankTransfer: { ...prev.bankTransfer, [field]: value } } : prev));
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await apiRequest<PaymentSettings>("/admin/settings/payments", {
        method: "PATCH",
        body: {
          enabledPaymentMethods: data.methods.filter((m) => m.enabled).map((m) => m.provider),
          bankTransferBankName: data.bankTransfer.bankName,
          bankTransferAccountName: data.bankTransfer.accountName,
          bankTransferAccountNumber: data.bankTransfer.accountNumber,
          bankTransferInstructions: data.bankTransfer.instructions,
        },
      });
      setData(res);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <div className="max-w-3xl space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const bankTransferOn = data.methods.find((m) => m.provider === "BANK_TRANSFER")?.enabled;
  const liveCount = data.methods.filter((m) => m.available).length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Payment methods</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Choose what customers can pay with at checkout.
      </p>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}
      {saved && (
        <Alert variant="success" className="mt-4">
          Payment settings saved.
        </Alert>
      )}
      {liveCount === 0 && (
        <Alert variant="error" className="mt-4">
          No payment method is currently available, so nobody can complete an order. Enable at
          least one below.
        </Alert>
      )}

      <Card className="mt-6">
        <CardHeader>
          <p className="font-semibold text-ink-900">Available at checkout</p>
        </CardHeader>
        <CardBody className="divide-y divide-neutral-200 p-0">
          {data.methods.map((method) => (
            <div key={method.provider} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink-900">{method.label}</p>
                  {method.primary && <Badge variant="brand">Recommended</Badge>}
                  {!method.configured && <Badge variant="warning">Not configured</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-neutral-500">{method.detail}</p>
                {!method.configured && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Set {REQUIRED_KEYS[method.provider] ?? "its credentials"} in the environment to
                    use this. It stays hidden at checkout until then, even when switched on here.
                  </p>
                )}
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={method.enabled}
                aria-label={`${method.enabled ? "Disable" : "Enable"} ${method.label}`}
                onClick={() => toggle(method.provider)}
                className={cn(
                  "relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                  method.enabled ? "bg-brand-600" : "bg-neutral-300",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    method.enabled ? "translate-x-[1.375rem]" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          ))}
        </CardBody>
      </Card>

      {bankTransferOn && (
        <Card className="mt-6">
          <CardHeader>
            <p className="font-semibold text-ink-900">Bank transfer details</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-neutral-500">
              Shown to the customer after they place a bank-transfer order. Without an account
              number they have no way to pay, so the method stays hidden at checkout until both the
              bank and account number are filled in.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Bank name"
                value={data.bankTransfer.bankName}
                onChange={(e) => setBankField("bankName", e.target.value)}
              />
              <Input
                label="Account name"
                value={data.bankTransfer.accountName}
                onChange={(e) => setBankField("accountName", e.target.value)}
              />
            </div>
            <Input
              label="Account number"
              value={data.bankTransfer.accountNumber}
              onChange={(e) => setBankField("accountNumber", e.target.value)}
            />
            <Textarea
              label="Instructions (optional)"
              rows={3}
              placeholder="e.g. Use your order number as the transfer reference."
              value={data.bankTransfer.instructions}
              onChange={(e) => setBankField("instructions", e.target.value)}
            />
          </CardBody>
        </Card>
      )}

      <Button className="mt-6" onClick={handleSave} isLoading={saving}>
        Save payment settings
      </Button>
    </div>
  );
}
