import "server-only";
import { StoreSetting, type StoreSettingDoc } from "@/server/models";
import { getStoreSettings } from "@/server/services/logistics";
import { shipbubbleService } from "@/server/services/logistics/shipbubble.service";
import { isShipbubbleConfigured } from "@/server/lib/shipbubble";
import type { UpdateStoreSettingsInput } from "@/server/validation/admin/settings.schema";

function toDto(settings: StoreSettingDoc) {
  return { ...settings, id: String(settings._id) };
}

/** Fields whose change invalidates a previously validated pickup address. */
function pickupChanged(current: StoreSettingDoc, input: UpdateStoreSettingsInput): boolean {
  return (
    (input.pickupAddress !== undefined && input.pickupAddress !== current.pickupAddress) ||
    (input.pickupLatitude !== undefined && input.pickupLatitude !== current.pickupLatitude) ||
    (input.pickupLongitude !== undefined && input.pickupLongitude !== current.pickupLongitude)
  );
}

export const adminSettingsService = {
  async get() {
    const settings = await getStoreSettings();
    return {
      settings: toDto(settings),
      // Lets the admin UI explain *why* courier selection is off, rather than
      // silently showing an empty state.
      shipbubbleConfigured: isShipbubbleConfigured(),
    };
  },

  async update(input: UpdateStoreSettingsInput) {
    const current = await getStoreSettings();
    const update: Record<string, unknown> = { ...input };

    // Blank email clears rather than storing an empty string.
    if (input.pickupEmail === "") update.pickupEmail = null;

    // Re-validate with Shipbubble when the pickup location moves, so the
    // cached sender address code can never describe a different place than
    // the address shown in the form.
    if (pickupChanged(current, input) && isShipbubbleConfigured()) {
      const name = input.pickupName ?? current.pickupName;
      const email = (input.pickupEmail || current.pickupEmail) ?? "";
      const phone = input.pickupPhone ?? current.pickupPhone;
      const address = input.pickupAddress ?? current.pickupAddress;

      if (name && email && phone && address) {
        const validated = await shipbubbleService.validateAddress({
          name,
          email,
          phone,
          address,
          latitude: input.pickupLatitude ?? current.pickupLatitude,
          longitude: input.pickupLongitude ?? current.pickupLongitude,
        });
        update.pickupAddressCode = validated.addressCode;
      } else {
        // Incomplete contact details can't be validated — drop the stale code
        // so rates fall back rather than quoting from the old location.
        update.pickupAddressCode = null;
      }
    }

    const saved = await StoreSetting.findOneAndUpdate({ key: "default" }, update, {
      new: true,
      upsert: true,
    }).lean<StoreSettingDoc>();

    return toDto(saved as StoreSettingDoc);
  },

  /** Shipbubble's package categories, for the settings dropdown. */
  async listShipbubbleCategories() {
    if (!isShipbubbleConfigured()) return [];
    return shipbubbleService.listCategories();
  },
};
