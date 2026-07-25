import { prisma } from "@/lib/prisma";

const LOW_STOCK_THRESHOLD = 5;

export const adminDashboardService = {
  async getStats() {
    const [
      totalOrders,
      revenueAggregate,
      totalProducts,
      totalUsers,
      pendingSellerApplications,
      lowStockVariants,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
        _sum: { total: true },
      }),
      prisma.product.count(),
      prisma.user.count(),
      prisma.seller.count({ where: { status: "PENDING" } }),
      prisma.productVariant.count({ where: { stockQuantity: { lte: LOW_STOCK_THRESHOLD } } }),
      prisma.order.findMany({
        orderBy: { placedAt: "desc" },
        take: 5,
        select: { id: true, orderNumber: true, status: true, total: true, placedAt: true },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: (revenueAggregate._sum.total ?? 0).toString(),
      totalProducts,
      totalUsers,
      pendingSellerApplications,
      lowStockVariants,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        total: order.total.toString(),
      })),
    };
  },
};
