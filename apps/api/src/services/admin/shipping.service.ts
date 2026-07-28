import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import type {
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
} from "@/validation/admin/shipping.schema";

export const adminShippingService = {
  async list() {
    return prisma.shippingZone.findMany({ orderBy: { createdAt: "asc" } });
  },

  async create(input: CreateShippingZoneInput) {
    if (input.isDefault) {
      await prisma.shippingZone.updateMany({ data: { isDefault: false } });
    }
    return prisma.shippingZone.create({ data: input });
  },

  async update(id: string, input: UpdateShippingZoneInput) {
    const existing = await prisma.shippingZone.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Shipping zone not found");
    }
    if (input.isDefault) {
      await prisma.shippingZone.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.shippingZone.update({ where: { id }, data: input });
  },

  async delete(id: string) {
    const existing = await prisma.shippingZone.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Shipping zone not found");
    }
    await prisma.shippingZone.delete({ where: { id } });
  },
};
