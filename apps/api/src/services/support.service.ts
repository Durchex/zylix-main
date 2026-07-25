import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { ContactMessageInput } from "@/validation/support.schema";

export const supportService = {
  async submitContactMessage(input: ContactMessageInput) {
    const message = await prisma.contactMessage.create({ data: input });
    logger.info("Contact message received", { id: message.id, subject: message.subject });
    return message;
  },
};
