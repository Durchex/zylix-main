import "server-only";
import { Types, type FilterQuery } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { paginate } from "@/server/lib/pagination";
import { containsInsensitive } from "@/server/lib/query";
import { authService, sanitizeUser } from "@/server/services/auth.service";
import { auditLogService } from "@/server/services/admin/auditLog.service";
import { User, type UserDoc } from "@/server/models";
import type { AdminUserListQuery, UpdateUserStatusInput } from "@/server/validation/admin/user.schema";

export const adminUserService = {
  async list(query: AdminUserListQuery) {
    const filter: FilterQuery<UserDoc> = {};
    if (query.role) filter.role = query.role;
    if (query.search) {
      const pattern = containsInsensitive(query.search);
      filter.$or = [{ email: pattern }, { firstName: pattern }, { lastName: pattern }];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<UserDoc[]>(),
      User.countDocuments(filter),
    ]);

    return paginate(items.map(sanitizeUser), total, query);
  },

  async getById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "User not found");
    }
    const user = await User.findById(id).lean<UserDoc>();
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return sanitizeUser(user);
  },

  async updateStatus(id: string, input: UpdateUserStatusInput, adminUserId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "User not found");
    }
    const existing = await User.findById(id).lean<UserDoc>();
    if (!existing) {
      throw new ApiError(404, "User not found");
    }
    if (existing.role === "ADMIN") {
      throw new ApiError(400, "Cannot change the status of an admin account from this endpoint");
    }

    const updated = await User.findByIdAndUpdate(id, { status: input.status }, { new: true }).lean<UserDoc>();

    if (input.status !== "ACTIVE") {
      await authService.logoutAll(id);
    }

    await auditLogService.record(adminUserId, "USER_STATUS_CHANGED", "User", id, {
      newStatus: input.status,
    });

    return sanitizeUser(updated as UserDoc);
  },
};
