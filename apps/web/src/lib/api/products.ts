import { apiRequest } from "@/lib/api-client";
import type {
  CategorySummary,
  PaginatedResult,
  ProductDetail,
  ProductSummary,
} from "@/types/product";

export interface ProductListParams {
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "rating";
  featured?: boolean;
  page?: number;
  pageSize?: number;
}

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const productsApi = {
  list(params: ProductListParams = {}) {
    return apiRequest<PaginatedResult<ProductSummary>>(`/products${buildQuery(params)}`);
  },

  getBySlug(slug: string) {
    return apiRequest<{ product: ProductDetail }>(`/products/${slug}`);
  },

  search(query: string, params: Omit<ProductListParams, "search"> = {}) {
    return apiRequest<PaginatedResult<ProductSummary>>(
      `/products${buildQuery({ ...params, search: query })}`,
    );
  },
};

export const categoriesApi = {
  list() {
    return apiRequest<{ categories: CategorySummary[] }>("/categories");
  },

  getBySlug(slug: string) {
    return apiRequest<{ category: CategorySummary }>(`/categories/${slug}`);
  },
};
