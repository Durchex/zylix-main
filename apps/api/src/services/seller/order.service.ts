import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import type { SellerOrderListQuery, UpdateFulfillmentInput } from "@/validation/seller/order.schema";

function itemsInclude(sellerId: string) {
  return {
    where: { sellerId },
  } as const;
}

export const sellerOrderService = {
  async list(sellerId: string, query: SellerOrderListQuery) {
    const where = { items: { some: { sellerId } } };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: itemsInclude(sellerId),
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { placedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return paginate(orders, total, query);
  },

  async getById(sellerId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, items: { some: { sellerId } } },
      include: {
        items: itemsInclude(sellerId),
        user: { select: { firstName: true, lastName: true, email: true } },
        shippingAddress: true,
      },
    });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return order;
  },

  async updateItemFulfillment(
    sellerId: string,
    orderId: string,
    itemId: string,
    input: UpdateFulfillmentInput,
  ) {
    const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== orderId || item.sellerId !== sellerId) {
      throw new ApiError(404, "Order item not found");
    }

    return prisma.orderItem.update({
      where: { id: itemId },
      data: { fulfillmentStatus: input.fulfillmentStatus },
    });
  },
};
