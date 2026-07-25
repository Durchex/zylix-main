import type { Metadata } from "next";
import { ResetPasswordForm } from "@/app/auth/reset-password/[token]/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
