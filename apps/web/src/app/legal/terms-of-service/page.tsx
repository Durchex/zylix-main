import type { Metadata } from "next";
import { LegalLayout } from "@/components/storefront/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Zylix.",
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service" updatedAt="14 July 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Zylix,
        operated by Durchex D.A.M Company LTD. By creating an account or placing an order, you
        agree to these Terms.
      </p>

      <h2>Accounts</h2>
      <p>
        You must provide accurate information when registering and are responsible for keeping
        your password and two-factor authentication credentials confidential. You&rsquo;re
        responsible for all activity under your account.
      </p>

      <h2>Orders and pricing</h2>
      <p>
        Prices are listed in Nigerian Naira (NGN) and include applicable taxes unless stated
        otherwise. We reserve the right to cancel an order — with a full refund — if a listing
        error, stock issue, or suspected fraud is identified after purchase.
      </p>

      <h2>Sellers</h2>
      <p>
        Some products may be listed and fulfilled by approved third-party sellers rather than
        Durchex D.A.M Company LTD directly. Seller listings are subject to Zylix&rsquo;s catalog
        and quality standards, but the seller is responsible for accurate listing information and
        timely fulfilment of their own orders.
      </p>

      <h2>Prohibited conduct</h2>
      <ul>
        <li>Attempting to defraud Zylix, other users, or payment providers.</li>
        <li>Circumventing security features, rate limits, or account restrictions.</li>
        <li>Reselling products in violation of manufacturer or seller terms.</li>
      </ul>

      <h2>Limitation of liability</h2>
      <p>
        Zylix is provided &ldquo;as is.&rdquo; To the fullest extent permitted by law, Durchex
        D.A.M Company LTD is not liable for indirect or consequential damages arising from your
        use of the platform.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of Zylix after changes take
        effect constitutes acceptance of the revised Terms.
      </p>
    </LegalLayout>
  );
}
