export interface AdminProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface AdminProductVariant {
  id: string;
  sku: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  stockQuantity: number;
  isDefault: boolean;
}

export interface AdminProduct {
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
  isFeatured: boolean;
  // Only meaningful when variants is empty — see the schema comment on
  // Product.stockQuantity.
  stockQuantity: number;
  avgRating: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  category: { id: string; slug: string; name: string };
  seller: { id: string; storeName: string; storeSlug: string };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: string;
  currency: string;
  placedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
}

export interface AdminOrderItem {
  id: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  fulfillmentStatus: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  subtotal: string;
  shippingFee: string;
  tax: string;
  items: AdminOrderItem[];
  statusHistory: Array<{ id: string; status: OrderStatus; note: string | null; createdAt: string }>;
  shippingAddress: { fullName: string; line1: string; city: string; state: string } | null;
}

export type SellerStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

export interface AdminSeller {
  id: string;
  storeName: string;
  storeSlug: string;
  description: string | null;
  status: SellerStatus;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  _count: { products: number };
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "BANNED" | "PENDING_VERIFICATION";
  createdAt: string;
}

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  coverImageUrl: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  author: { firstName: string; lastName: string };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { firstName: string; lastName: string; email: string } | null;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: string;
  totalProducts: number;
  totalUsers: number;
  pendingSellerApplications: number;
  lowStockVariants: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    placedAt: string;
  }>;
}
