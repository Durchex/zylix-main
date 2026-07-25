import type { Metadata } from "next";
import { LegalLayout } from "@/components/storefront/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Zylix and Durchex D.A.M Company LTD collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" updatedAt="14 July 2026">
      <p>
        Zylix (&ldquo;Zylix,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is operated by Durchex
        D.A.M Company LTD. This Privacy Policy explains what personal data we collect when you
        use zylix.com, why we collect it, and the choices you have.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>Account information: name, email address, phone number, delivery addresses.</li>
        <li>
          Order information: items purchased, order value, and payment status (we do not store
          raw card numbers — payments are processed by Flutterwave, Paystack, Stripe, PayPal, or
          the relevant wallet provider, and we only retain a tokenized reference).
        </li>
        <li>Usage data: pages viewed, search queries, device and browser type, IP address.</li>
        <li>Communications: messages you send us via contact forms, live chat, or WhatsApp.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To process and deliver your orders.</li>
        <li>To provide customer support and respond to inquiries.</li>
        <li>To send order updates, and — with your consent — marketing communications.</li>
        <li>To detect and prevent fraud.</li>
        <li>To improve our catalog, search, and recommendations.</li>
      </ul>

      <h2>Sharing your information</h2>
      <p>
        We share data with payment providers (to process transactions), delivery partners (to
        fulfil orders), and sellers on our marketplace (limited to what&rsquo;s needed to fulfil
        an order placed with them). We do not sell your personal data to third parties.
      </p>

      <h2>Your rights</h2>
      <p>
        You can access, correct, or request deletion of your account data at any time from{" "}
        <a href="/account/settings" className="text-brand-600 underline underline-offset-2">
          Account Settings
        </a>
        , or by contacting us at the details below.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent via our{" "}
        <a href="/support/contact" className="text-brand-600 underline underline-offset-2">
          Contact page
        </a>
        .
      </p>
    </LegalLayout>
  );
}
