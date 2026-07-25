import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { paginate } from "@/utils/pagination";
import { authService, sanitizeUser } from "@/services/auth.service";
import { auditLogService } from "@/services/admin/auditLog.service";
import type { AdminUserListQuery, UpdateUserStatusInput } from "@/validation/admin/user.schema";

export const adminUserService = {
  async list(query: AdminUserListQuery) {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return paginate(items.map(sanitizeUser), total, query);
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return sanitizeUser(user);
  },

  async updateStatus(id: string, input: UpdateUserStatusInput, adminUserId: string) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "User not found");
    }
    if (existing.role === "ADMIN") {
      throw new ApiError(400, "Cannot change the status of an admin account from this endpoint");
    }

    const updated = await prisma.user.update({ where: { id }, data: { status: input.status } });

    if (input.status !== "ACTIVE") {
      await authService.logoutAll(id);
    }

    await auditLogService.record(adminUserId, "USER_STATUS_CHANGED", "User", id, {
      newStatus: input.status,
    });

    return sanitizeUser(updated);
  },
};
