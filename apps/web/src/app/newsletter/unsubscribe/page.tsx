import { Suspense } from "react";
import type { Metadata } from "next";
import { UnsubscribeStatus } from "@/app/newsletter/unsubscribe/UnsubscribeStatus";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
};

export default function NewsletterUnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeStatus />
    </Suspense>
  );
}
