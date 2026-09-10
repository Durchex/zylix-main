/**
 * Where the address step parks its result for the payment step to pick up.
 *
 * Session storage rather than a query string or a server draft: it holds a
 * phone number and street address, which have no business being in a URL,
 * and it should not outlive the browser session.
 *
 * The stored value is one of two shapes — `{ addressId }` when the customer
 * picked a saved address, or `{ shippingAddress }` when they typed a new one.
 * Both are forwarded to /shipping/rates and /orders as-is.
 */
export const CHECKOUT_ADDRESS_KEY = "zylix-checkout-address";

export interface StoredCheckoutAddress {
  addressId?: string;
  shippingAddress?: Record<string, unknown>;
}

export function readCheckoutAddress(): StoredCheckoutAddress {
  try {
    return JSON.parse(sessionStorage.getItem(CHECKOUT_ADDRESS_KEY) ?? "{}") as StoredCheckoutAddress;
  } catch {
    return {};
  }
}

export function writeCheckoutAddress(value: StoredCheckoutAddress): void {
  sessionStorage.setItem(CHECKOUT_ADDRESS_KEY, JSON.stringify(value));
}
