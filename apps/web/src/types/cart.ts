export interface CartLineItem {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  currency: string;
  quantity: number;
  maxQuantity: number;
}
