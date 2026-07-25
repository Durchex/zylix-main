import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";

const summarySelect = {
  id: true,
  storeName: true,
  storeSlug: true,
  logoUrl: true,
  description: true,
} as const;

export const sellerService = {
  async list() {
    const sellers = await prisma.seller.findMany({
      where: { status: "APPROVED" },
      orderBy: { storeName: "asc" },
      select: summarySelect,
    });
    return sellers;
  },

  async getBySlug(slug: string) {
    const seller = await prisma.seller.findFirst({
      where: { storeSlug: slug, status: "APPROVED" },
      select: summarySelect,
    });
    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }
    return seller;
  },
};
