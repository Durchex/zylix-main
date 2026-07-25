"use client";

import { AuthGuard } from "@/components/providers/AuthGuard";
import { Container } from "@/components/ui/Container";
import { ReferralDashboard } from "@/app/referral/ReferralDashboard";

export default function ReferralPage() {
  return (
    <AuthGuard>
      <Container className="max-w-2xl py-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Refer & Earn</h1>
        <p className="mt-2 text-neutral-600">
          Share your link — you and your friend both earn reward points when they place their
          first order.
        </p>
        <div className="mt-8">
          <ReferralDashboard />
        </div>
      </Container>
    </AuthGuard>
  );
}
