export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  stockQuantity: number;
  isDefault: boolean;
}

export interface ProductAttribute {
  attributeName: string;
  value: string;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  basePrice: string;
  compareAtPrice: string | null;
  currency: string;
  avgRating: string;
  reviewCount: number;
  isFeatured: boolean;
  primaryImage: ProductImage | null;
  category: { id: string; slug: string; name: string };
  // Only meaningful when defaultVariant is null — the product sells directly
  // at basePrice using this count. Ignored when a variant exists.
  stockQuantity: number;
  defaultVariant: { id: string; price: string; stockQuantity: number } | null;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  sku: string;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  seller: { id: string; storeName: string; storeSlug: string };
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  parentId: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
