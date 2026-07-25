"use client";

import { TwoFactorSettings } from "@/app/account/security/TwoFactorSettings";

export default function AccountSecurityPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">Security</h1>
      <div className="mt-8">
        <TwoFactorSettings />
      </div>
    </div>
  );
}
