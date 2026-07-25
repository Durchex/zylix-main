import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/app/auth/login/LoginForm";

export const metadata: Metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
