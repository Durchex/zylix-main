"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";

type SetupStage = "idle" | "awaiting-code" | "backup-codes";

export function TwoFactorSettings() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [stage, setStage] = useState<SetupStage>("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  async function startSetup() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await apiRequest<{ secret: string; qrCodeDataUrl: string }>(
        "/auth/2fa/setup",
        { method: "POST" },
      );
      setSecret(result.secret);
      setQrCodeDataUrl(result.qrCodeDataUrl);
      setStage("awaiting-code");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmSetup() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await apiRequest<{ backupCodes: string[] }>("/auth/2fa/confirm", {
        method: "POST",
        body: { code },
      });
      setBackupCodes(result.backupCodes);
      setStage("backup-codes");
      if (user && accessToken) setSession({ ...user, twoFactorEnabled: true }, accessToken);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Invalid code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function disableTwoFactor() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiRequest("/auth/2fa/disable", { method: "POST", body: { password: disablePassword } });
      setDisablePassword("");
      setStage("idle");
      if (user && accessToken) setSession({ ...user, twoFactorEnabled: false }, accessToken);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Incorrect password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-semibold text-ink-900">Two-factor authentication</p>
      </CardHeader>
      <CardBody className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {user.twoFactorEnabled && stage === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Two-factor authentication is currently enabled on your account.
            </p>
            <Input
              label="Enter your password to disable"
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
            />
            <Button variant="destructive" isLoading={isSubmitting} onClick={disableTwoFactor}>
              Disable two-factor authentication
            </Button>
          </div>
        )}

        {!user.twoFactorEnabled && stage === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Add an extra layer of security using an authenticator app (Google Authenticator, Authy, 1Password).
            </p>
            <Button isLoading={isSubmitting} onClick={startSetup}>
              Set up two-factor authentication
            </Button>
          </div>
        )}

        {stage === "awaiting-code" && qrCodeDataUrl && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
            </p>
            <Image src={qrCodeDataUrl} alt="Two-factor setup QR code" width={180} height={180} unoptimized />
            <p className="break-all text-xs text-neutral-400">Manual entry key: {secret}</p>
            <Input
              label="6-digit code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button isLoading={isSubmitting} onClick={confirmSetup}>
              Confirm and enable
            </Button>
          </div>
        )}

        {stage === "backup-codes" && (
          <div className="space-y-3">
            <Alert variant="success" title="Two-factor authentication enabled">
              Save these backup codes somewhere safe — each can be used once if you lose access to
              your authenticator app.
            </Alert>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-50 p-4 font-mono text-sm">
              {backupCodes.map((backupCode) => (
                <span key={backupCode}>{backupCode}</span>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
