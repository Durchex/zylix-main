import "server-only";
import crypto from "crypto";
import mongoose, { Types } from "mongoose";
import { env } from "@/server/config/env";
import { ApiError } from "@/server/http/errors";
import { getPaymentProvider } from "@/server/services/payment";
import { shippingService } from "@/server/services/shipping.service";
import { paginate } from "@/server/lib/pagination";
import {
  Address,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  Product,
  ProductImage,
  ProductVariant,
  User,
  type OrderDoc,
  type OrderItemDoc,
  type PaymentDoc,
  type ProductDoc,
  type ProductVariantDoc,
} from "@/server/models";
import type { CreateOrderInput, MyOrderListQuery } from "@/server/validation/order.schema";

function generateOrderNumber(): string {
  return `ZLX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

interface LineItem {
  productId: Types.ObjectId;
  variantId: Types.ObjectId | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

/**
 * Reverses the stock decrement from a line-item list. Used both when payment
 * initiation fails (unwind an order that was never actually going to be
 * paid for) and would be used again for a cancellation flow.
 */
async function restoreStock(lineItems: LineItem[], session?: mongoose.ClientSession) {
  await Promise.all(
    lineItems.map((item) =>
      item.variantId
        ? ProductVariant.updateOne(
            { _id: item.variantId },
            { $inc: { stockQuantity: item.quantity } },
            { session },
          )
        : Product.updateOne(
            { _id: item.productId },
            { $inc: { stockQuantity: item.quantity } },
            { session },
          ),
    ),
  );
}

export const orderService = {
  async createOrder(userId: string, input: CreateOrderInput) {
    const user = await User.findById(userId).select("email").lean();
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))].filter((id) =>
      Types.ObjectId.isValid(id),
    );
    const products = await Product.find({ _id: { $in: productIds }, status: "ACTIVE" }).lean<
      ProductDoc[]
    >();
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const variantIds = input.items
      .map((item) => item.variantId)
      .filter((id): id is string => Boolean(id) && Types.ObjectId.isValid(id ?? ""));
    const variants = await ProductVariant.find({ _id: { $in: variantIds } }).lean<
      ProductVariantDoc[]
    >();
    const variantById = new Map(variants.map((v) => [String(v._id), v]));

    const lineItems: LineItem[] = input.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) {
        throw new ApiError(400, `Product ${item.productId} is not available`);
      }

      const variant = item.variantId ? variantById.get(item.variantId) : undefined;
      if (item.variantId && (!variant || String(variant.productId) !== item.productId)) {
        throw new ApiError(400, `Variant ${item.variantId} is not available`);
      }

      const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
      if (availableStock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${product.name}`);
      }

      const unitPrice = variant ? variant.price : product.basePrice;

      return {
        productId: product._id,
        variantId: variant?._id ?? null,
        productNameSnapshot: product.name,
        skuSnapshot: variant?.sku ?? product.sku,
        unitPrice,
        quantity: item.quantity,
        subtotal: unitPrice * item.quantity,
      };
    });

    const subtotalValue = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const quote = await shippingService.getQuote(input.shippingAddress.state, subtotalValue);
    const shippingFee = quote.fee;
    const total = subtotalValue + shippingFee;

    // Stock is reserved (decremented) up front, atomically with the order
    // and its items, inside a session — a transaction needs a replica set,
    // which every real deployment target (Atlas included) already is.
    const session = await mongoose.startSession();
    // Definite-assignment: both are set inside the transaction callback
    // below, which TS's control-flow analysis can't see through.
    let order!: OrderDoc;
    let payment!: PaymentDoc;
    try {
      await session.withTransaction(async () => {
        // Conditional decrement (only when enough stock remains) inside the
        // same transaction two concurrent checkouts for the last unit can't
        // both succeed — the loser's filter matches nothing and the whole
        // transaction aborts, same as Postgres's row lock would have done.
        for (const item of lineItems) {
          const result = item.variantId
            ? await ProductVariant.updateOne(
                { _id: item.variantId, stockQuantity: { $gte: item.quantity } },
                { $inc: { stockQuantity: -item.quantity } },
                { session },
              )
            : await Product.updateOne(
                { _id: item.productId, stockQuantity: { $gte: item.quantity } },
                { $inc: { stockQuantity: -item.quantity } },
                { session },
              );
          if (result.matchedCount === 0) {
            throw new ApiError(400, `Insufficient stock for ${item.productNameSnapshot}`);
          }
        }

        const [address] = await Address.create(
          [{ userId, type: "SHIPPING", ...input.shippingAddress }],
          { session },
        );

        const [createdOrder] = await Order.create(
          [
            {
              orderNumber: generateOrderNumber(),
              userId,
              status: "PENDING",
              subtotal: subtotalValue,
              shippingFee,
              tax: 0,
              total,
              shippingAddressId: address._id,
              billingAddressId: address._id,
            },
          ],
          { session },
        );

        await OrderItem.create(
          lineItems.map((item) => ({ ...item, orderId: createdOrder._id })),
          { session },
        );
        await OrderStatusHistory.create(
          [{ orderId: createdOrder._id, status: "PENDING", note: "Order placed" }],
          { session },
        );
        const [createdPayment] = await Payment.create(
          [{ orderId: createdOrder._id, provider: input.paymentProvider, amount: total, status: "PENDING" }],
          { session },
        );

        order = createdOrder.toObject() as OrderDoc;
        payment = createdPayment.toObject() as PaymentDoc;
      });
    } finally {
      await session.endSession();
    }

    // Payment initiation is an external network call — deliberately kept
    // outside the transaction above. If it fails (provider unconfigured,
    // insufficient wallet balance, etc.), unwind the order and restore stock
    // rather than leaving an orphaned PENDING order behind.
    try {
      const provider = getPaymentProvider(input.paymentProvider);
      const result = await provider.initiate({
        orderId: String(order!._id),
        orderNumber: order!.orderNumber,
        amount: total,
        currency: order!.currency,
        email: user.email,
        userId,
        redirectUrl: `${env.APP_URL}/checkout/confirmation/${order!._id}`,
      });

      await Payment.updateOne(
        { _id: payment!._id },
        { providerRef: result.providerRef, status: result.status === "SUCCESS" ? "SUCCESS" : "PENDING" },
      );

      if (result.status === "SUCCESS") {
        await Order.updateOne({ _id: order!._id }, { status: "PAID" });
        await OrderStatusHistory.create({
          orderId: order!._id,
          status: "PAID",
          note: `Paid via ${input.paymentProvider}`,
        });
      }

      return {
        orderId: String(order!._id),
        orderNumber: order!.orderNumber,
        checkoutUrl: result.checkoutUrl,
        status: result.status,
      };
    } catch (err) {
      const unwindSession = await mongoose.startSession();
      try {
        await unwindSession.withTransaction(async () => {
          await restoreStock(lineItems, unwindSession);
          await Order.deleteOne({ _id: order!._id }, { session: unwindSession });
          await OrderItem.deleteMany({ orderId: order!._id }, { session: unwindSession });
          await OrderStatusHistory.deleteMany({ orderId: order!._id }, { session: unwindSession });
          await Payment.deleteMany({ orderId: order!._id }, { session: unwindSession });
        });
      } finally {
        await unwindSession.endSession();
      }
      throw err;
    }
  },

  /**
   * Deliberately public and minimal: the checkout confirmation page is
   * rendered server-side without the browser's in-memory access token, so it
   * can only rely on the order ID (a high-entropy ObjectId) as a bearer
   * secret — same accepted pattern as most storefronts' guest
   * order-confirmation pages. Only non-sensitive fields are returned.
   */
  async getConfirmation(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new ApiError(404, "Order not found");
    }
    const order = await Order.findById(orderId).select("orderNumber total currency status").lean();
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return {
      orderNumber: order.orderNumber,
      total: String(order.total),
      currency: order.currency,
      status: order.status,
    };
  },

  async track(orderNumber: string, email: string) {
    const order = await Order.findOne({ orderNumber }).lean<OrderDoc>();
    const orderUser = order?.userId ? await User.findById(order.userId).select("email").lean() : null;

    const matches = order && ((order as { guestEmail?: string }).guestEmail === email || orderUser?.email === email);

    if (!matches) {
      throw new ApiError(404, "We couldn't find an order matching those details");
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      trackingNumber: order.trackingNumber ?? null,
      carrier: order.carrier ?? null,
      shippedAt: order.shippedAt ?? null,
      estimatedDelivery: null as string | null,
    };
  },

  async listMine(userId: string, query: MyOrderListQuery) {
    const filter = { userId };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ placedAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<OrderDoc[]>(),
      Order.countDocuments(filter),
    ]);

    const withItems = await attachOrderSummaries(orders);
    return paginate(withItems, total, query);
  },

  async getMineById(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new ApiError(404, "Order not found");
    }
    const order = await Order.findOne({ _id: orderId, userId }).lean<OrderDoc>();
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const [items, shippingAddress, billingAddress, statusHistory, payments] = await Promise.all([
      OrderItem.find({ orderId: order._id }).lean<OrderItemDoc[]>(),
      order.shippingAddressId ? Address.findById(order.shippingAddressId).lean() : null,
      order.billingAddressId ? Address.findById(order.billingAddressId).lean() : null,
      OrderStatusHistory.find({ orderId: order._id }).sort({ createdAt: 1 }).lean(),
      Payment.find({ orderId: order._id }).sort({ createdAt: -1 }).limit(1).lean<PaymentDoc[]>(),
    ]);

    return {
      ...order,
      id: String(order._id),
      items: await withProductRefs(items),
      shippingAddress,
      billingAddress,
      statusHistory,
      payments,
    };
  },
};

/**
 * Attaches each order's line items with a thumbnail-sized product reference —
 * the shape the "my orders" list needs. Batched across the whole page of
 * orders rather than per order, mirroring the batching in product.service.ts.
 */
async function attachOrderSummaries(orders: OrderDoc[]) {
  const orderIds = orders.map((o) => o._id);
  const items = await OrderItem.find({ orderId: { $in: orderIds } }).lean<OrderItemDoc[]>();
  const itemsByOrder = new Map<string, OrderItemDoc[]>();
  for (const item of items) {
    const key = String(item.orderId);
    const list = itemsByOrder.get(key) ?? [];
    list.push(item);
    itemsByOrder.set(key, list);
  }

  const withRefs = await withProductRefs(items);
  const refByItemId = new Map(withRefs.map((item) => [String(item._id), item]));

  return orders.map((order) => ({
    ...order,
    id: String(order._id),
    items: (itemsByOrder.get(String(order._id)) ?? []).map(
      (item) => refByItemId.get(String(item._id)) ?? item,
    ),
  }));
}

/** Adds the { id, slug, name, image } product reference Prisma's `include` used to join in. */
async function withProductRefs(items: OrderItemDoc[]) {
  const productIds = [...new Set(items.map((i) => String(i.productId)))];
  const [products, images] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).select("_id slug name").lean(),
    ProductImage.find({ productId: { $in: productIds } }).sort({ sortOrder: 1 }).lean(),
  ]);
  const productById = new Map(products.map((p) => [String(p._id), p]));
  const firstImageByProduct = new Map<string, (typeof images)[number]>();
  for (const image of images) {
    const key = String(image.productId);
    if (!firstImageByProduct.has(key)) firstImageByProduct.set(key, image);
  }

  return items.map((item) => {
    const product = productById.get(String(item.productId));
    const image = firstImageByProduct.get(String(item.productId));
    return {
      ...item,
      id: String(item._id),
      product: product
        ? {
            id: String(product._id),
            slug: product.slug,
            name: product.name,
            images: image ? [{ id: String(image._id), url: image.url, sortOrder: image.sortOrder }] : [],
          }
        : null,
    };
  });
}
