"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/utils";
import { apiRequest, ApiRequestError } from "@/lib/api-client";
import type { WalletSummary, RewardSummary, ReferralSummary } from "@/types/wallet";

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [rewards, setRewards] = useState<RewardSummary | null>(null);
  const [referral, setReferral] = useState<ReferralSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      apiRequest<WalletSummary>("/wallet"),
      apiRequest<RewardSummary>("/rewards"),
      apiRequest<ReferralSummary>("/referrals/me").catch(() => null),
    ])
      .then(([w, r, ref]) => {
        setWallet(w);
        setRewards(r);
        setReferral(ref);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  function copyReferralLink() {
    if (!referral) return;
    navigator.clipboard.writeText(`${window.location.origin}/auth/register?ref=${referral.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Wallet & Rewards</h1>
      <p className="mt-1 text-sm text-neutral-500">Your balance, loyalty points, and referral earnings.</p>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="text-center">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Wallet balance</p>
            {!wallet ? (
              <Skeleton className="mx-auto mt-2 h-8 w-24" />
            ) : (
              <p className="mt-2 text-2xl font-bold text-ink-900">
                {formatPrice(wallet.balance, wallet.currency)}
              </p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Reward points</p>
            {!rewards ? (
              <Skeleton className="mx-auto mt-2 h-8 w-24" />
            ) : (
              <p className="mt-2 text-2xl font-bold text-ink-900">{rewards.balance}</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Friends referred</p>
            {!referral ? (
              <Skeleton className="mx-auto mt-2 h-8 w-24" />
            ) : (
              <p className="mt-2 text-2xl font-bold text-ink-900">{referral.totalReferred}</p>
            )}
          </CardBody>
        </Card>
      </div>

      {referral && (
        <Card className="mt-6">
          <CardHeader>
            <p className="font-semibold text-ink-900">Refer & earn</p>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-neutral-600">
              Share your referral code — you&apos;ve earned {referral.totalRewardsEarned} points from{" "}
              {referral.totalReferred} referral{referral.totalReferred === 1 ? "" : "s"} so far.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <code className="flex-1 truncate text-sm text-ink-900">{referral.code}</code>
              <button
                type="button"
                onClick={copyReferralLink}
                className="text-sm font-medium text-brand-600 underline underline-offset-2"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <p className="font-semibold text-ink-900">Wallet transactions</p>
        </CardHeader>
        <CardBody className="divide-y divide-neutral-100">
          {!wallet ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : wallet.transactions.items.length === 0 ? (
            <p className="py-3 text-sm text-neutral-500">No wallet activity yet.</p>
          ) : (
            wallet.transactions.items.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-ink-900">{txn.reason}</p>
                  <p className="text-xs text-neutral-500">{new Date(txn.createdAt).toLocaleString("en-NG")}</p>
                </div>
                <Badge variant={txn.type === "CREDIT" ? "success" : "error"}>
                  {txn.type === "CREDIT" ? "+" : "-"}
                  {formatPrice(txn.amount, wallet.currency)}
                </Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <p className="font-semibold text-ink-900">Rewards history</p>
        </CardHeader>
        <CardBody className="divide-y divide-neutral-100">
          {!rewards ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : rewards.ledger.items.length === 0 ? (
            <p className="py-3 text-sm text-neutral-500">No reward points activity yet.</p>
          ) : (
            rewards.ledger.items.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-ink-900">{entry.type}</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(entry.createdAt).toLocaleString("en-NG")}
                  </p>
                </div>
                <Badge variant={entry.type === "EARN" ? "success" : "neutral"}>
                  {entry.type === "EARN" ? "+" : "-"}
                  {entry.points} pts
                </Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
