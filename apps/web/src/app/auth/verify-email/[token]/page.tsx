import type { Metadata } from "next";
import { VerifyEmailStatus } from "@/app/auth/verify-email/[token]/VerifyEmailStatus";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <VerifyEmailStatus token={token} />;
}
