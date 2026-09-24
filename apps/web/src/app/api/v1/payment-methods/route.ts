import { withRoute } from "@/server/http/route";
import { paymentSettingsService } from "@/server/services/payment/settings.service";

/**
 * Payment methods checkout should offer. Public — checkout renders this
 * rather than holding its own hardcoded list, so switching a method off in
 * admin takes effect without a deploy.
 *
 * Only the customer-facing shape is returned; whether a method is off because
 * an admin disabled it or because its keys are missing isn't the shopper's
 * business.
 */
export const GET = withRoute(async () => {
  const methods = await paymentSettingsService.listAvailable();
  return {
    methods: methods.map(({ provider, label, detail, primary }) => ({
      provider,
      label,
      detail,
      primary,
    })),
  };
});
