import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import type { AdminOrderListQuery, UpdateOrderStatusInput } from "@/validation/admin/order.schema";

const summarySelect = {
  id: true,
  orderNumber: true,
  status: true,
  total: true,
  currency: true,
  placedAt: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.OrderSelect;

const detailInclude = {
  items: true,
  payments: true,
  statusHistory: { orderBy: { createdAt: "desc" as const } },
  shippingAddress: true,
  billingAddress: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.OrderInclude;

export const adminOrderService = {
  async list(query: AdminOrderListQuery) {
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: "insensitive" } },
        { user: { email: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: summarySelect,
        orderBy: { placedAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return paginate(items, total, query);
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({ where: { id }, include: detailInclude });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    return order;
  },

  async updateStatus(id: string, input: UpdateOrderStatusInput, adminUserId: string) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Order not found");
    }

    return prisma.order.update({
      where: { id },
      data: {
        status: input.status,
        statusHistory: {
          create: { status: input.status, note: input.note, changedBy: adminUserId },
        },
      },
      include: detailInclude,
    });
  },
};
