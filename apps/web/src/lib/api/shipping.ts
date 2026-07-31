import { apiRequest } from "@/lib/api-client";

export interface ShippingQuote {
  fee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  zoneName: string;
}

export const shippingApi = {
  getQuote(state: string, subtotal: number) {
    return apiRequest<{ quote: ShippingQuote }>(
      `/shipping/quote?state=${encodeURIComponent(state)}&subtotal=${subtotal}`,
    );
  },
};
