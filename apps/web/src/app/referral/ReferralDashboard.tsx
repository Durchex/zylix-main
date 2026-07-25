"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { apiRequest, ApiRequestError } from "@/lib/api-client";

interface ReferralData {
  code: string;
  totalReferred: number;
  totalRewardsEarned: number;
}

export function ReferralDashboard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiRequest<ReferralData>("/referrals/me")
      .then(setData)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/register?ref=${data.code}`
      : "";

  function handleCopy() {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <p className="text-sm text-neutral-500">Your referral link</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={shareLink}
              className="h-11 flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3.5 text-sm text-ink-900"
            />
            <Button onClick={handleCopy}>{copied ? "Copied!" : "Copy link"}</Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm text-neutral-500">Friends referred</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{data.totalReferred}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-neutral-500">Rewards earned</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">
              {data.totalRewardsEarned.toLocaleString()} pts
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
