import "server-only";
import { shipbubbleRequest } from "@/server/lib/shipbubble";

/**
 * Typed wrappers over the Shipbubble endpoints this app uses. Field names on
 * the wire are Shipbubble's (including `reciever_address_code`, whose
 * spelling is theirs and must be sent exactly as-is); everything crossing
 * back into the app is camelCased so their API shape stays in this file.
 */

export interface ShipbubbleAddress {
  addressCode: number;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ShipbubbleCourier {
  courierId: string;
  courierName: string;
  serviceCode: string;
  total: number;
  currency: string;
  deliveryEta?: string | null;
  pickupEta?: string | null;
}

export interface ShipbubbleRates {
  requestToken: string;
  couriers: ShipbubbleCourier[];
}

export interface PackageItem {
  name: string;
  description: string;
  unitWeight: number;
  unitAmount: number;
  quantity: number;
}

export interface PackageDimension {
  length: number;
  width: number;
  height: number;
}

interface RawValidatedAddress {
  address_code: number;
  formatted_address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface RawCourier {
  courier_id: string | number;
  courier_name: string;
  service_code: string;
  total: number | string;
  currency?: string;
  delivery_eta?: string | null;
  pickup_eta_time?: string | null;
}

interface RawRates {
  request_token: string;
  couriers: RawCourier[];
}

interface RawShipment {
  order_id: string;
  tracking_url?: string | null;
  status?: string | null;
  payment?: { shipping_fee?: number; status?: string; currency?: string } | null;
}

interface RawCategory {
  category_id: number;
  category: string;
}

export const shipbubbleService = {
  /**
   * Exchanges a postal address for the `address_code` every rate request and
   * shipment is keyed by. Coordinates are sent when we have them — Shipbubble
   * treats them as authoritative over the address string.
   */
  async validateAddress(input: {
    name: string;
    email: string;
    phone: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<ShipbubbleAddress> {
    const data = await shipbubbleRequest<RawValidatedAddress>("/shipping/address/validate", {
      method: "POST",
      body: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        ...(input.latitude != null && input.longitude != null
          ? { latitude: input.latitude, longitude: input.longitude }
          : {}),
      },
    });

    return {
      addressCode: data.address_code,
      formattedAddress: data.formatted_address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postal_code ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };
  },

  async fetchRates(input: {
    senderAddressCode: number;
    receiverAddressCode: number;
    pickupDate: string;
    categoryId: number;
    packageItems: PackageItem[];
    packageDimension: PackageDimension;
  }): Promise<ShipbubbleRates> {
    const data = await shipbubbleRequest<RawRates>("/shipping/fetch_rates", {
      method: "POST",
      body: {
        sender_address_code: input.senderAddressCode,
        // Their spelling, not a typo on our side — the API rejects the
        // correctly-spelled key.
        reciever_address_code: input.receiverAddressCode,
        pickup_date: input.pickupDate,
        category_id: input.categoryId,
        package_items: input.packageItems.map((item) => ({
          name: item.name,
          description: item.description,
          unit_weight: String(item.unitWeight),
          unit_amount: String(item.unitAmount),
          quantity: String(item.quantity),
        })),
        package_dimension: input.packageDimension,
      },
    });

    return {
      requestToken: data.request_token,
      couriers: (data.couriers ?? []).map((courier) => ({
        courierId: String(courier.courier_id),
        courierName: courier.courier_name,
        serviceCode: courier.service_code,
        total: Number(courier.total),
        currency: courier.currency ?? "NGN",
        deliveryEta: courier.delivery_eta ?? null,
        pickupEta: courier.pickup_eta_time ?? null,
      })),
    };
  },

  /**
   * Books the label. This is the point money actually moves — Shipbubble
   * debits the merchant's wallet — which is why it's only ever called from
   * the admin booking route, never automatically on payment.
   */
  async createShipment(input: {
    requestToken: string;
    courierId: string;
    serviceCode: string;
  }): Promise<{ shipbubbleOrderId: string; trackingUrl: string | null; status: string | null }> {
    const data = await shipbubbleRequest<RawShipment>("/shipping/labels", {
      method: "POST",
      body: {
        request_token: input.requestToken,
        courier_id: input.courierId,
        service_code: input.serviceCode,
      },
    });

    return {
      shipbubbleOrderId: data.order_id,
      trackingUrl: data.tracking_url ?? null,
      status: data.status ?? null,
    };
  },

  async listCategories(): Promise<Array<{ categoryId: number; category: string }>> {
    const data = await shipbubbleRequest<RawCategory[]>("/shipping/labels/categories");
    return (data ?? []).map((c) => ({ categoryId: c.category_id, category: c.category }));
  },
};
