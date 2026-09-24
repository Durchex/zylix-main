import { z } from "zod";
import { PAYMENT_PROVIDERS } from "@/server/models/enums";

export const updatePaymentSettingsSchema = z.object({
  // Sent whole rather than as individual toggles, so the saved list is always
  // exactly what the admin was looking at — no merge ambiguity if two tabs
  // save at once.
  enabledPaymentMethods: z.array(z.enum(PAYMENT_PROVIDERS)).optional(),

  // Empty strings clear a field; the service maps them to null.
  bankTransferBankName: z.string().trim().max(120).optional(),
  bankTransferAccountName: z.string().trim().max(120).optional(),
  bankTransferAccountNumber: z.string().trim().max(40).optional(),
  bankTransferInstructions: z.string().trim().max(500).optional(),
});
export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>;
