import { Types } from "mongoose";
import { withRoute } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { ApiError } from "@/server/http/errors";
import { logisticsService } from "@/server/services/logistics";
import { Order, OrderStatusHistory, type OrderDoc } from "@/server/models";

/**
 * Books the shipment for an order with the courier the customer chose.
 *
 * Deliberately admin-triggered rather than automatic on payment: booking a
 * label debits the store's Shipbubble wallet, so it stays a decision someone
 * makes rather than a side effect of a webhook that could drain the balance
 * or fail silently.
 */
export const POST = withRoute(async (req, { params }) => {
  const admin = requireRole(req, "ADMIN");

  if (!Types.ObjectId.isValid(params.id)) {
    throw new ApiError(404, "Order not found");
  }

  const order = await Order.findById(params.id).lean<OrderDoc>();
  if (!order) throw new ApiError(404, "Order not found");

  if (order.shipbubbleOrderId) {
    throw new ApiError(409, "A shipment has already been booked for this order");
  }
  if (order.status !== "PAID" && order.status !== "PROCESSING") {
    throw new ApiError(400, "Only a paid order can be shipped");
  }
  if (!order.shipbubbleRequestToken || !order.courierId || !order.serviceCode) {
    throw new ApiError(
      400,
      "This order has no courier selection — it was placed on the flat-rate shipping fallback.",
    );
  }

  const shipment = await logisticsService.bookShipment({
    requestToken: order.shipbubbleRequestToken,
    courierId: order.courierId,
    serviceCode: order.serviceCode,
  });

  await Order.updateOne(
    { _id: order._id },
    {
      shipbubbleOrderId: shipment.shipbubbleOrderId,
      trackingUrl: shipment.trackingUrl,
      // Shipbubble's own order id doubles as the tracking reference until a
      // courier waybill arrives via webhook.
      trackingNumber: shipment.shipbubbleOrderId,
      shipmentStatus: shipment.status,
      status: "PROCESSING",
      shippedAt: new Date(),
    },
  );

  await OrderStatusHistory.create({
    orderId: order._id,
    status: "PROCESSING",
    note: `Shipment booked with ${order.courierName ?? "courier"} (${shipment.shipbubbleOrderId})`,
    changedBy: admin.id,
  });

  return { shipment };
});
