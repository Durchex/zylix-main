import "server-only";
import { paginate } from "@/server/lib/pagination";
import { AuditLog, User } from "@/server/models";

export const auditLogService = {
  async record(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    await AuditLog.create({ actorId, action, entityType, entityId, metadata: metadata ?? null });
  },

  async list(query: { page: number; pageSize: number }) {
    const [items, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      AuditLog.countDocuments(),
    ]);

    const actorIds = [...new Set(items.map((log) => (log.actorId ? String(log.actorId) : null)))].filter(
      (id): id is string => Boolean(id),
    );
    const actors = await User.find({ _id: { $in: actorIds } }).select("firstName lastName email").lean();
    const actorById = new Map(actors.map((a) => [String(a._id), a]));

    const dtos = items.map((log) => ({
      id: String(log._id),
      actorId: log.actorId ? String(log.actorId) : null,
      actor: log.actorId
        ? (() => {
            const actor = actorById.get(String(log.actorId));
            return actor
              ? { firstName: actor.firstName, lastName: actor.lastName, email: actor.email }
              : null;
          })()
        : null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata ?? null,
      createdAt: log.createdAt,
    }));

    return paginate(dtos, total, query);
  },
};
