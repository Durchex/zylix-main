export type SellerProfileStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

export interface SellerProfile {
  id: string;
  storeName: string;
  storeSlug: string;
  description: string | null;
  status: SellerProfileStatus;
  createdAt: string;
}

export interface SellerDashboardStats {
  totalProducts: number;
  lowStockVariants: number;
  totalOrderItems: number;
  totalRevenue: string;
  recentOrderItems: Array<{
    id: string;
    productNameSnapshot: string;
    quantity: number;
    subtotal: string;
    fulfillmentStatus: string;
    order: { id: string; orderNumber: string; placedAt: string };
  }>;
}

export interface SellerProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface SellerProductVariant {
  id: string;
  sku: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  stockQuantity: number;
  isDefault: boolean;
}

export interface SellerProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  sku: string;
  basePrice: string;
  compareAtPrice: string | null;
  currency: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  images: SellerProductImage[];
  variants: SellerProductVariant[];
  category: { id: string; slug: string; name: string };
}

export type FulfillmentStatus = "UNFULFILLED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface SellerOrderItem {
  id: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  fulfillmentStatus: FulfillmentStatus;
}

export interface SellerOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  placedAt: string;
  items: SellerOrderItem[];
  user: { firstName: string; lastName: string; email: string } | null;
}

export interface SellerOrderDetail extends SellerOrderSummary {
  shippingAddress: { fullName: string; line1: string; city: string; state: string } | null;
}
