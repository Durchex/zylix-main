import { z } from "zod";

export const unsubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
