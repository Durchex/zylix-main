import type { Metadata } from "next";
import { LegalLayout } from "@/components/storefront/LegalLayout";

export const metadata: Metadata = {
  title: "Returns & Refunds Policy",
  description: "How returns, exchanges, and refunds work at Zylix.",
};

export default function ReturnsPolicyPage() {
  return (
    <LegalLayout title="Returns & Refunds Policy" updatedAt="14 July 2026">
      <p>
        We want you to be happy with your purchase. Most items can be returned within 7 days of
        delivery if unused, in original packaging, with all accessories included.
      </p>

      <h2>How to start a return</h2>
      <p>
        Go to{" "}
        <a href="/account/returns" className="text-brand-600 underline underline-offset-2">
          My Returns
        </a>{" "}
        from your account, select the order and item, and choose a reason. We&rsquo;ll review the
        request and send return shipping instructions once approved.
      </p>

      <h2>Non-returnable items</h2>
      <ul>
        <li>Items marked &ldquo;Final Sale&rdquo; on the product page.</li>
        <li>Opened consumables, screen protectors, and earphones/earbuds for hygiene reasons.</li>
        <li>Products with removed or damaged serial numbers.</li>
      </ul>

      <h2>Refunds</h2>
      <p>
        Once we receive and inspect a returned item, refunds are issued to your Zylix Wallet
        immediately, or back to your original payment method within 5–10 business days depending
        on your provider. Store credit refunds can be used on any future purchase.
      </p>

      <h2>Damaged or incorrect items</h2>
      <p>
        If you received a damaged, defective, or incorrect item, contact{" "}
        <a href="/support/contact" className="text-brand-600 underline underline-offset-2">
          Support
        </a>{" "}
        within 48 hours of delivery with photos — we&rsquo;ll prioritize a replacement or refund.
      </p>
    </LegalLayout>
  );
}
