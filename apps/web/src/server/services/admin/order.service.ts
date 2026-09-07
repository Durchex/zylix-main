import "server-only";
import { Types, type FilterQuery } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { paginate } from "@/server/lib/pagination";
import { containsInsensitive } from "@/server/lib/query";
import {
  Address,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  User,
  type OrderDoc,
  type UserDoc,
} from "@/server/models";
import type {
  AdminOrderListQuery,
  UpdateOrderStatusInput,
  UpdateOrderTrackingInput,
} from "@/server/validation/admin/order.schema";

interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function userRef(user: UserDoc | null): UserRef | null {
  if (!user) return null;
  return { id: String(user._id), firstName: user.firstName, lastName: user.lastName, email: user.email };
}

async function toSummary(order: OrderDoc, userById: Map<string, UserRef>) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    total: String(order.total),
    currency: order.currency,
    placedAt: order.placedAt,
    user: order.userId ? userById.get(String(order.userId)) ?? null : null,
  };
}

async function toDetail(order: OrderDoc) {
  const [items, payments, statusHistory, shippingAddress, billingAddress, user] = await Promise.all([
    OrderItem.find({ orderId: order._id }).lean(),
    Payment.find({ orderId: order._id }).lean(),
    OrderStatusHistory.find({ orderId: order._id }).sort({ createdAt: -1 }).lean(),
    order.shippingAddressId ? Address.findById(order.shippingAddressId).lean() : null,
    order.billingAddressId ? Address.findById(order.billingAddressId).lean() : null,
    order.userId ? User.findById(order.userId).lean<UserDoc>() : null,
  ]);

  return {
    ...order,
    id: String(order._id),
    total: String(order.total),
    items: items.map((i) => ({ ...i, id: String(i._id) })),
    payments: payments.map((p) => ({ ...p, id: String(p._id), amount: String(p.amount) })),
    statusHistory: statusHistory.map((h) => ({ ...h, id: String(h._id) })),
    shippingAddress,
    billingAddress,
    user: userRef(user),
  };
}

export const adminOrderService = {
  async list(query: AdminOrderListQuery) {
    const filter: FilterQuery<OrderDoc> = {};
    if (query.status) filter.status = query.status;

    if (query.search) {
      const pattern = containsInsensitive(query.search);
      const matchingUsers = await User.find({ email: pattern }).select("_id").lean();
      filter.$or = [
        { orderNumber: pattern },
        { userId: { $in: matchingUsers.map((u) => u._id) } },
      ];
    }

    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ placedAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<OrderDoc[]>(),
      Order.countDocuments(filter),
    ]);

    const userIds = [...new Set(items.map((o) => (o.userId ? String(o.userId) : null)))].filter(
      (id): id is string => Boolean(id),
    );
    const users = await User.find({ _id: { $in: userIds } }).lean<UserDoc[]>();
    const userById = new Map(users.map((u) => [String(u._id), userRef(u)!]));

    const summaries = await Promise.all(items.map((order) => toSummary(order, userById)));
    return paginate(summaries, total, query);
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Order not found");
    }
    const order = await Order.findById(id).lean<OrderDoc>();
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return toDetail(order);
  },

  async updateStatus(id: string, input: UpdateOrderStatusInput, adminUserId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Order not found");
    }
    const existing = await Order.findById(id).lean();
    if (!existing) {
      throw new ApiError(404, "Order not found");
    }

    await Order.updateOne({ _id: id }, { status: input.status });
    await OrderStatusHistory.create({
      orderId: id,
      status: input.status,
      note: input.note,
      changedBy: adminUserId,
    });

    return toDetail((await Order.findById(id).lean()) as OrderDoc);
  },

  async updateTracking(id: string, input: UpdateOrderTrackingInput) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Order not found");
    }
    const existing = await Order.findById(id).lean<OrderDoc>();
    if (!existing) {
      throw new ApiError(404, "Order not found");
    }

    await Order.updateOne(
      { _id: id },
      {
        trackingNumber: input.trackingNumber,
        carrier: input.carrier,
        // Stamp shippedAt the first time a tracking number is set; never
        // overwrite it on subsequent edits (e.g. a carrier correction).
        shippedAt: existing.shippedAt ?? (input.trackingNumber ? new Date() : existing.shippedAt),
      },
    );

    return toDetail((await Order.findById(id).lean()) as OrderDoc);
  },
};
