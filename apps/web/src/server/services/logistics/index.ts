import "server-only";
import { Types } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { isShipbubbleConfigured } from "@/server/lib/shipbubble";
import {
  Address,
  Product,
  ProductVariant,
  ShippingRateQuote,
  StoreSetting,
  type AddressDoc,
  type ProductDoc,
  type StoreSettingDoc,
} from "@/server/models";
import { shipbubbleService, type PackageItem } from "./shipbubble.service";

/** Shipbubble request tokens expire after 7 days; quotes are dropped with them. */
const QUOTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Descriptions go to a courier manifest, not a product page. */
const ITEM_DESCRIPTION_MAX = 120;

export interface RateRequestItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CourierOption {
  courierId: string;
  courierName: string;
  serviceCode: string;
  total: number;
  currency: string;
  deliveryEta?: string | null;
}

/** Reads the singleton settings row, creating it with defaults on first use. */
export async function getStoreSettings(): Promise<StoreSettingDoc> {
  const existing = await StoreSetting.findOne({ key: "default" }).lean<StoreSettingDoc>();
  if (existing) return existing;

  const created = await StoreSetting.create({ key: "default" });
  return created.toObject() as StoreSettingDoc;
}

/**
 * Whether courier selection can be offered at all. False sends checkout down
 * the flat-rate ShippingZone path instead of failing.
 */
export async function isLogisticsAvailable(): Promise<boolean> {
  if (!isShipbubbleConfigured()) return false;
  const settings = await getStoreSettings();
  return Boolean(settings.pickupAddressCode && settings.shipbubbleCategoryId);
}

/**
 * Resolves an address to a Shipbubble address code, reusing the cached one
 * when present so a repeat customer's saved address isn't re-validated on
 * every checkout.
 */
async function resolveAddressCode(address: AddressDoc, fallbackEmail: string): Promise<number> {
  if (address.shipbubbleAddressCode) return address.shipbubbleAddressCode;

  const validated = await shipbubbleService.validateAddress({
    name: address.fullName,
    email: address.email ?? fallbackEmail,
    phone: address.phone,
    // Shipbubble asks for state and country in the string itself; coordinates
    // (when Places supplied them) override it anyway.
    address: [address.line1, address.line2, address.city, address.state, address.country]
      .filter(Boolean)
      .join(", "),
    latitude: address.latitude,
    longitude: address.longitude,
  });

  await Address.updateOne({ _id: address._id }, { shipbubbleAddressCode: validated.addressCode });
  return validated.addressCode;
}

/**
 * Builds the parcel description from the cart.
 *
 * Dimensions are summed as a single stacked box rather than per-item, since
 * Shipbubble quotes one parcel per request: the widest and longest item wins,
 * and heights add up. It's an approximation, but it errs toward over-stating
 * the parcel rather than under-quoting the customer.
 */
async function buildPackage(items: RateRequestItem[], settings: StoreSettingDoc) {
  const productIds = items.map((i) => i.productId).filter((id) => Types.ObjectId.isValid(id));
  const products = await Product.find({ _id: { $in: productIds } }).lean<ProductDoc[]>();
  const productById = new Map(products.map((p) => [String(p._id), p]));

  const variantIds = items
    .map((i) => i.variantId)
    .filter((id): id is string => Boolean(id) && Types.ObjectId.isValid(id));
  const variants = await ProductVariant.find({ _id: { $in: variantIds } }).lean();
  const variantById = new Map(variants.map((v) => [String(v._id), v]));

  const packageItems: PackageItem[] = [];
  let length = 0;
  let width = 0;
  let height = 0;

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) throw new ApiError(400, "One of the items is no longer available");

    const variant = item.variantId ? variantById.get(item.variantId) : undefined;
    const unitAmount = variant ? variant.price : product.basePrice;

    packageItems.push({
      name: product.name,
      description: (product.description ?? product.name).slice(0, ITEM_DESCRIPTION_MAX),
      unitWeight: product.weightKg ?? settings.defaultWeightKg,
      unitAmount,
      quantity: item.quantity,
    });

    length = Math.max(length, product.lengthCm ?? settings.defaultLengthCm);
    width = Math.max(width, product.widthCm ?? settings.defaultWidthCm);
    height += (product.heightCm ?? settings.defaultHeightCm) * item.quantity;
  }

  return { packageItems, packageDimension: { length, width, height } };
}

export const logisticsService = {
  /**
   * Quotes couriers for a cart going to a given address, and stores the quote
   * so order creation can price the chosen courier without trusting the
   * browser. Returns null when logistics isn't configured, which callers read
   * as "use the flat-rate fallback".
   */
  async quoteCouriers(input: {
    items: RateRequestItem[];
    address: AddressDoc;
    customerEmail: string;
    userId?: string | null;
  }): Promise<{ requestToken: string; couriers: CourierOption[] } | null> {
    if (!(await isLogisticsAvailable())) return null;

    const settings = await getStoreSettings();
    const receiverAddressCode = await resolveAddressCode(input.address, input.customerEmail);
    const { packageItems, packageDimension } = await buildPackage(input.items, settings);

    const rates = await shipbubbleService.fetchRates({
      senderAddressCode: settings.pickupAddressCode!,
      receiverAddressCode,
      // Couriers won't quote a pickup in the past; today is the earliest
      // meaningful date and Shipbubble reschedules from there.
      pickupDate: new Date().toISOString().slice(0, 10),
      categoryId: settings.shipbubbleCategoryId!,
      packageItems,
      packageDimension,
    });

    if (rates.couriers.length === 0) return null;

    await ShippingRateQuote.create({
      requestToken: rates.requestToken,
      userId: input.userId && Types.ObjectId.isValid(input.userId) ? input.userId : null,
      couriers: rates.couriers,
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
    });

    return { requestToken: rates.requestToken, couriers: rates.couriers };
  },

  /**
   * The authoritative price for a courier the customer selected. Looked up
   * from the stored quote rather than taken from the request body, so the fee
   * charged is always the one the courier actually quoted.
   */
  async resolveSelectedCourier(selection: {
    requestToken: string;
    courierId: string;
    serviceCode: string;
  }): Promise<CourierOption> {
    const quote = await ShippingRateQuote.findOne({ requestToken: selection.requestToken }).lean();
    if (!quote) {
      throw new ApiError(400, "That delivery quote has expired. Please re-select a courier.");
    }

    const courier = quote.couriers.find(
      (c) => c.courierId === selection.courierId && c.serviceCode === selection.serviceCode,
    );
    if (!courier) {
      throw new ApiError(400, "That delivery option is no longer available.");
    }

    return courier;
  },

  /** Books the label with the courier. Spends Shipbubble wallet balance. */
  async bookShipment(selection: { requestToken: string; courierId: string; serviceCode: string }) {
    return shipbubbleService.createShipment(selection);
  },
};
