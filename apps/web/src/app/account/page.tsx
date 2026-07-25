"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest } from "@/lib/api-client";

const QUICK_LINKS = [
  {
    href: "/account/orders",
    title: "Orders",
    description: "Track packages and view your order history.",
  },
  {
    href: "/account/addresses",
    title: "Addresses",
    description: "Manage shipping and billing addresses.",
  },
  {
    href: "/account/wallet",
    title: "Wallet & Rewards",
    description: "Check your balance, points, and referral link.",
  },
];

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  async function handleLogout() {
    await apiRequest("/auth/logout", { method: "POST" });
    clearSession();
    router.replace("/auth/login");
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">My Account</h1>
      <p className="mt-1 text-sm text-neutral-500">Welcome back, {user.firstName}.</p>

      <Card className="mt-8">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size="lg" />
            <div>
              <p className="font-semibold text-ink-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
          </div>
          <Badge variant={user.emailVerifiedAt ? "success" : "warning"}>
            {user.emailVerifiedAt ? "Verified" : "Unverified"}
          </Badge>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Role</span>
            <span className="text-ink-900">{user.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Two-factor authentication</span>
            <span className="text-ink-900">{user.twoFactorEnabled ? "Enabled" : "Disabled"}</span>
          </div>
        </CardBody>
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-ink-900">Quick links</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-elevated"
          >
            <p className="font-semibold text-ink-900">{link.title}</p>
            <p className="mt-1 text-sm text-neutral-500">{link.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/account/security">
          <Button variant="outline">Security settings</Button>
        </Link>
        <Button variant="ghost" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}
