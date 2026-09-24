import { withRoute, readJson } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { StoreSetting, type StoreSettingDoc } from "@/server/models";
import { paymentSettingsService } from "@/server/services/payment/settings.service";
import { getStoreSettings } from "@/server/services/logistics";
import { updatePaymentSettingsSchema } from "@/server/validation/admin/payment.schema";

export const GET = withRoute(async (req) => {
  requireRole(req, "ADMIN");

  const [methods, settings] = await Promise.all([
    paymentSettingsService.listAll(),
    getStoreSettings(),
  ]);

  return {
    methods,
    bankTransfer: {
      bankName: settings.bankTransferBankName ?? "",
      accountName: settings.bankTransferAccountName ?? "",
      accountNumber: settings.bankTransferAccountNumber ?? "",
      instructions: settings.bankTransferInstructions ?? "",
    },
  };
});

export const PATCH = withRoute(async (req) => {
  requireRole(req, "ADMIN");
  const input = updatePaymentSettingsSchema.parse(await readJson(req));

  const update: Record<string, unknown> = {};
  if (input.enabledPaymentMethods) {
    update.enabledPaymentMethods = input.enabledPaymentMethods;
  }

  // A blank field means "clear this", stored as null rather than an empty
  // string so getBankTransferDetails' presence check stays a simple truthiness
  // test.
  const bankFields = [
    ["bankTransferBankName", input.bankTransferBankName],
    ["bankTransferAccountName", input.bankTransferAccountName],
    ["bankTransferAccountNumber", input.bankTransferAccountNumber],
    ["bankTransferInstructions", input.bankTransferInstructions],
  ] as const;

  for (const [field, value] of bankFields) {
    if (value !== undefined) update[field] = value === "" ? null : value;
  }

  await StoreSetting.findOneAndUpdate({ key: "default" }, update, {
    new: true,
    upsert: true,
  }).lean<StoreSettingDoc>();

  // Returned in the same shape as GET so the page can render the saved state
  // straight back without a second request.
  const [methods, settings] = await Promise.all([
    paymentSettingsService.listAll(),
    getStoreSettings(),
  ]);

  return {
    methods,
    bankTransfer: {
      bankName: settings.bankTransferBankName ?? "",
      accountName: settings.bankTransferAccountName ?? "",
      accountNumber: settings.bankTransferAccountNumber ?? "",
      instructions: settings.bankTransferInstructions ?? "",
    },
  };
});
