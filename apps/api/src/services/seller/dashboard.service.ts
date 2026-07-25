import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 5;

export const sellerDashboardService = {
  async getStats(sellerId: string) {
    const [
      totalProducts,
      lowStockVariants,
      orderItemAggregate,
      recentOrderItems,
    ] = await Promise.all([
      prisma.product.count({ where: { sellerId } }),
      prisma.productVariant.count({
        where: { product: { sellerId }, stockQuantity: { lte: LOW_STOCK_THRESHOLD } },
      }),
      prisma.orderItem.aggregate({
        where: { sellerId, order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } } },
        _sum: { subtotal: true },
        _count: true,
      }),
      prisma.orderItem.findMany({
        where: { sellerId },
        orderBy: { id: "desc" },
        take: 5,
        select: {
          id: true,
          productNameSnapshot: true,
          quantity: true,
          subtotal: true,
          fulfillmentStatus: true,
          order: { select: { id: true, orderNumber: true, placedAt: true } },
        },
      }),
    ]);

    return {
      totalProducts,
      lowStockVariants,
      totalOrderItems: orderItemAggregate._count,
      totalRevenue: (orderItemAggregate._sum.subtotal ?? 0).toString(),
      recentOrderItems: recentOrderItems.map((item) => ({
        ...item,
        subtotal: item.subtotal.toString(),
      })),
    };
  },
};
