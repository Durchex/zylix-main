import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import type { SellerOnboardingInput } from "@/validation/seller/onboarding.schema";

export const sellerOnboardingService = {
  async apply(userId: string, input: SellerOnboardingInput) {
    const existing = await prisma.seller.findUnique({ where: { userId } });
    if (existing) {
      throw new ApiError(409, "You already have a seller profile");
    }

    const slugTaken = await prisma.seller.findUnique({ where: { storeSlug: input.storeSlug } });
    if (slugTaken) {
      throw new ApiError(409, "This store name is already taken");
    }

    const [seller] = await prisma.$transaction([
      prisma.seller.create({
        data: {
          userId,
          storeName: input.storeName,
          storeSlug: input.storeSlug,
          description: input.description,
          status: "PENDING",
        },
      }),
      prisma.user.update({ where: { id: userId }, data: { role: "SELLER" } }),
    ]);

    return seller;
  },

  async getMyProfile(userId: string) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      throw new ApiError(404, "No seller profile found for this account");
    }
    return seller;
  },
};
