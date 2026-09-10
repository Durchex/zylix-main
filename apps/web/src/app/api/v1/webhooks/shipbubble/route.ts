import { NextResponse } from "next/server";
import { withRoute } from "@/server/http/route";
import { ApiError } from "@/server/http/errors";
import { verifyShipbubbleWebhook } from "@/server/lib/shipbubble";
import { Order, OrderStatusHistory, type OrderDoc } from "@/server/models";

interface ShipbubbleWebhookPayload {
  event?: string;
  data?: {
    order_id?: string;
    status?: string;
    tracking_url?: string;
    waybill_number?: string;
    tracking_code?: string;
    delay_reason?: string;
    wallet_balance?: number;
    threshold?: number;
    currency?: string;
  };
}

/** Shipbubble statuses that mean the parcel reached the customer. */
const DELIVERED_STATUSES = new Set(["delivered", "completed"]);

export const POST = withRoute(async (req) => {
  // Signature is over the exact bytes received, so the raw text is read
  // before any parsing — same reason the Flutterwave route does this.
  const rawBody = await req.text();
  const signature = req.headers.get("x-ship-signature");

  if (!verifyShipbubbleWebhook(rawBody, signature)) {
    throw new ApiError(401, "Invalid webhook signature");
  }

  let payload: ShipbubbleWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ShipbubbleWebhookPayload;
  } catch {
    throw new ApiError(400, "Malformed webhook payload");
  }

  const event = payload.event ?? "";
  const data = payload.data ?? {};

  // Not tied to an order — the balance warning that matters because booking
  // labels spends wallet funds, and a flat balance stops fulfilment.
  if (event === "wallet.threshold.alert") {
    console.warn("[shipbubble] wallet balance low — shipments will fail to book once it runs out", {
      balance: data.wallet_balance,
      threshold: data.threshold,
      currency: data.currency,
    });
    return NextResponse.json({ received: true });
  }

  if (!data.order_id) return NextResponse.json({ received: true });

  const order = await Order.findOne({ shipbubbleOrderId: data.order_id }).lean<OrderDoc>();
  if (!order) {
    // A shipment we don't recognise (another integration, or a replay after
    // the order was removed) — acknowledged so Shipbubble stops retrying.
    console.warn("[shipbubble] webhook for unknown shipment", { orderId: data.order_id, event });
    return NextResponse.json({ received: true });
  }

  const update: Record<string, unknown> = {};
  if (data.status) update.shipmentStatus = data.status;
  if (data.tracking_url) update.trackingUrl = data.tracking_url;
  // A real courier waybill supersedes the Shipbubble order id we stored as a
  // placeholder when the label was booked.
  const waybill = data.waybill_number ?? data.tracking_code;
  if (waybill) update.trackingNumber = waybill;

  if (event === "shipment.cancelled") {
    update.shipmentStatus = "cancelled";
  } else if (data.status && DELIVERED_STATUSES.has(data.status.toLowerCase())) {
    update.status = "DELIVERED";
  }

  if (Object.keys(update).length > 0) {
    await Order.updateOne({ _id: order._id }, update);
  }

  if (update.status === "DELIVERED") {
    await OrderStatusHistory.create({
      orderId: order._id,
      status: "DELIVERED",
      note: `Delivered — reported by ${order.courierName ?? "courier"}`,
    });
  }

  return NextResponse.json({ received: true });
});
