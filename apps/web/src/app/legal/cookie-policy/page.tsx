import type { Metadata } from "next";
import { LegalLayout } from "@/components/storefront/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Zylix uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" updatedAt="14 July 2026">
      <p>
        Zylix uses cookies and similar technologies to keep you signed in, remember your cart and
        preferences, and understand how the site is used so we can improve it.
      </p>

      <h2>Types of cookies we use</h2>
      <ul>
        <li>
          <strong>Essential</strong> — required for core functionality like staying signed in and
          checkout. These can&rsquo;t be disabled.
        </li>
        <li>
          <strong>Preference</strong> — remember settings like currency and language.
        </li>
        <li>
          <strong>Analytics</strong> — help us understand traffic and usage patterns to improve
          the shopping experience.
        </li>
      </ul>

      <h2>Managing cookies</h2>
      <p>
        Most browsers let you block or delete cookies in their settings. Blocking essential
        cookies may prevent parts of Zylix — like staying signed in or completing checkout — from
        working correctly.
      </p>
    </LegalLayout>
  );
}
