import { z } from "zod";

export const walletTransactionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});
export type WalletTransactionListQuery = z.infer<typeof walletTransactionListQuerySchema>;
