import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import { auditLogService } from "@/services/admin/auditLog.service";
import type { AdminSellerListQuery } from "@/validation/admin/seller.schema";

export const adminSellerService = {
  async list(query: AdminSellerListQuery) {
    const where: Prisma.SellerWhereInput = {};
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.seller.count({ where }),
    ]);

    return paginate(items, total, query);
  },

  async getById(id: string) {
    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { products: true } },
      },
    });
    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }
    return seller;
  },

  async approve(id: string, adminUserId: string) {
    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }
    if (seller.status === "APPROVED") {
      throw new ApiError(409, "This seller is already approved");
    }

    const updated = await prisma.seller.update({ where: { id }, data: { status: "APPROVED" } });
    await auditLogService.record(adminUserId, "SELLER_APPROVED", "Seller", id, {
      storeName: seller.storeName,
    });
    return updated;
  },

  async reject(id: string, adminUserId: string, reason?: string) {
    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }

    const updated = await prisma.seller.update({ where: { id }, data: { status: "REJECTED" } });
    await auditLogService.record(adminUserId, "SELLER_REJECTED", "Seller", id, {
      storeName: seller.storeName,
      reason,
    });
    return updated;
  },
};
