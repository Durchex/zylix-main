"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { sellerOnboardingApi } from "@/lib/api/seller-dashboard";
import { ApiRequestError } from "@/lib/api-client";
import type { SellerProfile } from "@/types/seller-dashboard";

export function SellerDashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "redirecting">("loading");

  useEffect(() => {
    sellerOnboardingApi
      .getMyProfile()
      .then((res) => {
        setProfile(res.seller);
        setStatus("ready");
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setStatus("redirecting");
          router.replace("/seller/onboarding");
        } else {
          setStatus("ready");
        }
      });
  }, [router]);

  if (status === "loading" || status === "redirecting") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-500" />
      </div>
    );
  }

  return (
    <div>
      {profile?.status === "PENDING" && (
        <Alert variant="warning" title="Application pending" className="mb-6">
          Your seller application for &ldquo;{profile.storeName}&rdquo; is awaiting approval.
          You can preview your dashboard now, but your products won&rsquo;t go live until an
          admin approves your account.
        </Alert>
      )}
      {profile?.status === "REJECTED" && (
        <Alert variant="error" title="Application rejected" className="mb-6">
          Your seller application was not approved. Contact support if you have questions.
        </Alert>
      )}
      {profile?.status === "SUSPENDED" && (
        <Alert variant="error" title="Account suspended" className="mb-6">
          Your seller account has been suspended. Contact support for details.
        </Alert>
      )}
      {children}
    </div>
  );
}
