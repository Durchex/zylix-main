import { z } from "zod";

export const rewardLedgerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});
export type RewardLedgerListQuery = z.infer<typeof rewardLedgerListQuerySchema>;
