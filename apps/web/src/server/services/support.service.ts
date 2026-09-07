import "server-only";
import { ContactMessage } from "@/server/models";
import type { ContactMessageInput } from "@/server/validation/support.schema";

export const supportService = {
  async submitContactMessage(input: ContactMessageInput) {
    const message = await ContactMessage.create(input);
    console.info("[support] contact message received", {
      id: String(message._id),
      subject: message.subject,
    });
    return message;
  },
};
