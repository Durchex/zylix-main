import "server-only";
import { Order, Product, ProductVariant, User } from "@/server/models";

const LOW_STOCK_THRESHOLD = 5;

export const adminDashboardService = {
  async getStats() {
    const [totalOrders, revenueAggregate, totalProducts, totalUsers, lowStockVariants, recentOrders] =
      await Promise.all([
        Order.countDocuments(),
        Order.aggregate<{ total: number }>([
          { $match: { status: { $in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Product.countDocuments(),
        User.countDocuments(),
        ProductVariant.countDocuments({ stockQuantity: { $lte: LOW_STOCK_THRESHOLD } }),
        Order.find()
          .sort({ placedAt: -1 })
          .limit(5)
          .select("_id orderNumber status total placedAt")
          .lean(),
      ]);

    return {
      totalOrders,
      totalRevenue: String(revenueAggregate[0]?.total ?? 0),
      totalProducts,
      totalUsers,
      lowStockVariants,
      recentOrders: recentOrders.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        total: String(order.total),
        placedAt: order.placedAt,
      })),
    };
  },
};
