import { z } from "zod";

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const unsubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
