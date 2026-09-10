/**
 * The store's public contact number, in one place because it's rendered
 * three different ways: readable text, a `tel:` href, and a wa.me path.
 * Keeping the formats derived from a single source stops them drifting apart
 * (a display change that forgets the link is the usual way that happens).
 */
export const SUPPORT_PHONE_DISPLAY = "+234 916 823 9607";

/** E.164 — no spaces, keeps the leading +. What `tel:` expects. */
export const SUPPORT_PHONE_E164 = SUPPORT_PHONE_DISPLAY.replace(/\s/g, "");

/** wa.me wants the number with neither spaces nor a leading +. */
export const WHATSAPP_NUMBER = SUPPORT_PHONE_E164.replace(/^\+/, "");

export const SUPPORT_TEL_HREF = `tel:${SUPPORT_PHONE_E164}`;

/**
 * Opens a WhatsApp chat with the store, optionally pre-filling the message
 * box. Useful for "ask about this order" style links where the customer
 * shouldn't have to retype a reference.
 */
export function whatsAppHref(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
