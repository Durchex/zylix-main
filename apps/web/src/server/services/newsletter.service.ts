import "server-only";
import { NewsletterSubscriber } from "@/server/models";

export const newsletterService = {
  async subscribe(email: string) {
    await NewsletterSubscriber.updateOne(
      { email },
      { $set: { isSubscribed: true, subscribedAt: new Date(), unsubscribedAt: null } },
      { upsert: true },
    );
  },

  async unsubscribe(email: string) {
    await NewsletterSubscriber.updateOne(
      { email },
      { $set: { isSubscribed: false, unsubscribedAt: new Date() } },
      { upsert: true },
    );
  },
};
