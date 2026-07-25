import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { ApiError } from "@/middleware/errorHandler";
import { getPaymentProvider } from "@/services/payment";
import { paginate } from "@/utils/pagination";
import type { CreateOrderInput, MyOrderListQuery } from "@/validation/order.schema";

const myOrderListInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
        },
      },
    },
  },
} as const;

const FLAT_SHIPPING_FEE = 2000;
const FREE_SHIPPING_THRESHOLD = 100_000;

function generateOrderNumber(): string {
  return `ZLX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export const orderService = {
  async createOrder(userId: string, input: CreateOrderInput) {
    const [user, products] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } }),
      prisma.product.findMany({
        where: { id: { in: [...new Set(input.items.map((item) => item.productId))] }, status: "ACTIVE" },
        include: { variants: true },
      }),
    ]);
    const productById = new Map(products.map((p) => [p.id, p]));

    const lineItems = input.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) {
        throw new ApiError(400, `Product ${item.productId} is not available`);
      }

      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : undefined;
      if (item.variantId && !variant) {
        throw new ApiError(400, `Variant ${item.variantId} is not available`);
      }

      const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
      if (availableStock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${product.name}`);
      }

      const unitPrice = variant ? variant.price : product.basePrice;

      return {
        productId: product.id,
        variantId: variant?.id ?? null,
        sellerId: product.sellerId,
        productNameSnapshot: product.name,
        skuSnapshot: variant?.sku ?? product.sku,
        unitPrice,
        quantity: item.quantity,
        subtotal: unitPrice.mul(item.quantity),
      };
    });

    const subtotalValue = lineItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const shippingFee = subtotalValue >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
    const total = subtotalValue + shippingFee;

    const order = await prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: { userId, type: "SHIPPING", ...input.shippingAddress },
      });

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: "PENDING",
          subtotal: subtotalValue,
          shippingFee,
          tax: 0,
          total,
          shippingAddressId: address.id,
          billingAddressId: address.id,
          items: { create: lineItems },
          statusHistory: { create: { status: "PENDING", note: "Order placed" } },
          payments: {
            create: {
              provider: input.paymentProvider,
              amount: total,
              status: "PENDING",
            },
          },
        },
        include: { payments: true },
      });

      for (const item of lineItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }
      }

      return created;
    });

    // Payment initiation is an external network call — deliberately kept
    // outside the DB transaction above. If it fails (provider unconfigured,
    // insufficient wallet balance, etc.), unwind the order and restored
    // stock rather than leaving an orphaned PENDING order behind.
    try {
      const provider = getPaymentProvider(input.paymentProvider);
      const result = await provider.initiate({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: total,
        currency: order.currency,
        email: user.email,
        userId,
        redirectUrl: `${env.APP_URL}/checkout/confirmation/${order.id}`,
      });

      await prisma.payment.update({
        where: { id: order.payments[0]!.id },
        data: { providerRef: result.providerRef, status: result.status === "SUCCESS" ? "SUCCESS" : "PENDING" },
      });

      if (result.status === "SUCCESS") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            statusHistory: { create: { status: "PAID", note: `Paid via ${input.paymentProvider}` } },
          },
        });
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        checkoutUrl: result.checkoutUrl,
        status: result.status,
      };
    } catch (err) {
      await prisma.$transaction(async (tx) => {
        for (const item of lineItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          }
        }
        await tx.order.delete({ where: { id: order.id } });
      });
      throw err;
    }
  },

  /**
   * Deliberately public and minimal: the checkout confirmation page is
   * rendered server-side without the browser's in-memory access token, so it
   * can only rely on the order ID (a high-entropy cuid) as a bearer secret —
   * same accepted pattern as most storefronts' guest order-confirmation
   * pages. Only non-sensitive fields are returned.
   */
  async getConfirmation(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, total: true, currency: true, status: true },
    });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return {
      orderNumber: order.orderNumber,
      total: order.total.toString(),
      currency: order.currency,
      status: order.status,
    };
  },

  async track(orderNumber: string, email: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        placedAt: true,
        guestEmail: true,
        user: { select: { email: true } },
      },
    });

    const matches =
      order && (order.guestEmail === email || order.user?.email === email);

    if (!matches) {
      throw new ApiError(404, "We couldn't find an order matching those details");
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      estimatedDelivery: null as string | null,
    };
  },

  async listMine(userId: string, query: MyOrderListQuery) {
    const where = { userId };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: myOrderListInclude,
        orderBy: { placedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return paginate(orders, total, query);
  },

  async getMineById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        ...myOrderListInclude,
        shippingAddress: true,
        billingAddress: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return order;
  },
};
