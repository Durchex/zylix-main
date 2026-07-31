import { prisma } from "@/lib/prisma";

export const newsletterService = {
  async subscribe(email: string) {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, isSubscribed: true },
      update: { isSubscribed: true, subscribedAt: new Date(), unsubscribedAt: null },
    });
  },

  async unsubscribe(email: string) {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, isSubscribed: false, unsubscribedAt: new Date() },
      update: { isSubscribed: false, unsubscribedAt: new Date() },
    });
  },
};
