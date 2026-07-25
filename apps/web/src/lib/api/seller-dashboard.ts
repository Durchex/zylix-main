import { apiRequest } from "@/lib/api-client";
import type {
  FulfillmentStatus,
  SellerDashboardStats,
  SellerOrderDetail,
  SellerOrderSummary,
  SellerProduct,
  SellerProfile,
} from "@/types/seller-dashboard";
import type { PaginatedResult } from "@/types/product";

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

export const sellerOnboardingApi = {
  apply(input: { storeName: string; storeSlug: string; description?: string }) {
    return apiRequest<{ seller: SellerProfile }>("/seller/onboarding", {
      method: "POST",
      body: input,
    });
  },
  getMyProfile() {
    return apiRequest<{ seller: SellerProfile }>("/seller/me");
  },
};

export const sellerDashboardApi = {
  getStats() {
    return apiRequest<SellerDashboardStats>("/seller/dashboard/stats");
  },
};

export const sellerProductsApi = {
  list(params: { status?: string; search?: string; page?: number; pageSize?: number } = {}) {
    return apiRequest<PaginatedResult<SellerProduct>>(`/seller/products${buildQuery(params)}`);
  },
  getById(id: string) {
    return apiRequest<{ product: SellerProduct }>(`/seller/products/${id}`);
  },
  create(input: Record<string, unknown>) {
    return apiRequest<{ product: SellerProduct }>("/seller/products", { method: "POST", body: input });
  },
  update(id: string, input: Record<string, unknown>) {
    return apiRequest<{ product: SellerProduct }>(`/seller/products/${id}`, {
      method: "PATCH",
      body: input,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/seller/products/${id}`, { method: "DELETE" });
  },
};

export const sellerOrdersApi = {
  list(params: { page?: number; pageSize?: number } = {}) {
    return apiRequest<PaginatedResult<SellerOrderSummary>>(`/seller/orders${buildQuery(params)}`);
  },
  getById(orderId: string) {
    return apiRequest<{ order: SellerOrderDetail }>(`/seller/orders/${orderId}`);
  },
  updateFulfillment(orderId: string, itemId: string, fulfillmentStatus: FulfillmentStatus) {
    return apiRequest<{ item: unknown }>(`/seller/orders/${orderId}/items/${itemId}/fulfillment`, {
      method: "PATCH",
      body: { fulfillmentStatus },
    });
  },
};
