import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/storefront/LegalLayout";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Delivery timelines, fees, and coverage for Zylix orders.",
};

export default function ShippingPolicyPage() {
  return (
    <LegalLayout title="Shipping Policy" updatedAt="14 July 2026">
      <p>
        Zylix ships across Nigeria via our logistics partners. Shipping fees and estimated
        delivery windows are shown at checkout before you pay, based on your delivery address.
      </p>

      <h2>Delivery timelines</h2>
      <ul>
        <li>Lagos and major cities: 1–3 business days.</li>
        <li>Other states: 3–7 business days.</li>
        <li>Pre-order or made-to-order items: timeline shown on the product page.</li>
      </ul>

      <h2>Order tracking</h2>
      <p>
        Once your order ships, you can track its status from{" "}
        <Link href="/account/orders" className="text-brand-600 underline underline-offset-2">
          My Orders
        </Link>{" "}
        (if signed in), or via{" "}
        <Link href="/support/order-tracking" className="text-brand-600 underline underline-offset-2">
          Order Tracking
        </Link>{" "}
        using your order number and email.
      </p>

      <h2>Delivery issues</h2>
      <p>
        If a delivery is delayed beyond the estimated window, or an item arrives damaged, contact
        us via{" "}
        <a href="/support/contact" className="text-brand-600 underline underline-offset-2">
          Support
        </a>{" "}
        with your order number.
      </p>
    </LegalLayout>
  );
}
