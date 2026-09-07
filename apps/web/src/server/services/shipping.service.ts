import "server-only";
import { ShippingZone } from "@/server/models";

export interface ShippingQuote {
  fee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  zoneName: string;
}

const FALLBACK_QUOTE: ShippingQuote = {
  fee: 0,
  estimatedDaysMin: 3,
  estimatedDaysMax: 7,
  zoneName: "Standard",
};

export const shippingService = {
  async getQuote(state: string, subtotal: number): Promise<ShippingQuote> {
    const zones = await ShippingZone.find().lean();
    const normalized = state.trim().toLowerCase();

    const matched =
      zones.find((zone) => zone.states.some((s) => s.toLowerCase() === normalized)) ??
      zones.find((zone) => zone.isDefault) ??
      null;

    // No zones configured yet (fresh install, admin hasn't set any up) —
    // fall back to a safe default rather than breaking checkout.
    if (!matched) {
      return FALLBACK_QUOTE;
    }

    const threshold = matched.freeShippingThreshold ?? null;
    const fee = threshold !== null && subtotal >= threshold ? 0 : matched.fee;

    return {
      fee,
      estimatedDaysMin: matched.estimatedDaysMin,
      estimatedDaysMax: matched.estimatedDaysMax,
      zoneName: matched.name,
    };
  },
};
