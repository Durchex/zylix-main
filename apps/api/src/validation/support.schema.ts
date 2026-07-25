import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(10).max(5000),
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export const orderTrackingQuerySchema = z.object({
  orderNumber: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
});
