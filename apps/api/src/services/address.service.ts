import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import type { AddressInput, UpdateAddressInput } from "@/validation/address.schema";

export const addressService = {
  async list(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async create(userId: string, input: AddressInput) {
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId, type: input.type, isDefault: true },
        data: { isDefault: false },
      });
    }
    return prisma.address.create({ data: { userId, ...input } });
  },

  async update(userId: string, addressId: string, input: UpdateAddressInput) {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      throw new ApiError(404, "Address not found");
    }

    if (input.isDefault) {
      const type = input.type ?? existing.type;
      await prisma.address.updateMany({
        where: { userId, type, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({ where: { id: addressId }, data: input });
  },

  async remove(userId: string, addressId: string) {
    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      throw new ApiError(404, "Address not found");
    }
    await prisma.address.delete({ where: { id: addressId } });
  },
};
