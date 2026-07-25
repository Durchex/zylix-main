import type { Request, Response } from "express";
import { auditLogService } from "@/services/admin/auditLog.service";

export const auditLogController = {
  async list(req: Request, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const result = await auditLogService.list({ page, pageSize });
    res.status(200).json(result);
  },
};
