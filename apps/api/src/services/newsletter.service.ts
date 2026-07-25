import { prisma } from "@/lib/prisma";

export const newsletterService = {
  async unsubscribe(email: string) {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, isSubscribed: false, unsubscribedAt: new Date() },
      update: { isSubscribed: false, unsubscribedAt: new Date() },
    });
  },
};
