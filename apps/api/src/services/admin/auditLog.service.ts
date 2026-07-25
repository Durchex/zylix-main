import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { paginate } from "@/utils/pagination";

export const auditLogService = {
  async record(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  },

  async list(query: { page: number; pageSize: number }) {
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { firstName: true, lastName: true, email: true } } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.auditLog.count(),
    ]);
    return paginate(items, total, query);
  },
};
