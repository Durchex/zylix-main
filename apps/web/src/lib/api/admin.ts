import { apiRequest } from "@/lib/api-client";
import type {
  AdminBlogPost,
  AdminCategory,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminProduct,
  AdminSeller,
  AdminUser,
  AuditLogEntry,
  DashboardStats,
  OrderStatus,
  SellerStatus,
} from "@/types/admin";
import type { PaginatedResult } from "@/types/product";

export interface AdminProductListParams {
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  search?: string;
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

export const adminProductsApi = {
  list(params: AdminProductListParams = {}) {
    return apiRequest<PaginatedResult<AdminProduct>>(`/admin/products${buildQuery(params)}`);
  },
  getById(id: string) {
    return apiRequest<{ product: AdminProduct }>(`/admin/products/${id}`);
  },
  create(input: Record<string, unknown>) {
    return apiRequest<{ product: AdminProduct }>("/admin/products", { method: "POST", body: input });
  },
  bulkCreate(products: Record<string, unknown>[]) {
    return apiRequest<{ succeeded: AdminProduct[]; failed: Array<{ index: number; name: string; error: string }> }>(
      "/admin/products/bulk",
      { method: "POST", body: { products } },
    );
  },
  update(id: string, input: Record<string, unknown>) {
    return apiRequest<{ product: AdminProduct }>(`/admin/products/${id}`, {
      method: "PATCH",
      body: input,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/admin/products/${id}`, { method: "DELETE" });
  },
};

export const adminCategoriesApi = {
  list() {
    return apiRequest<{ categories: AdminCategory[] }>("/admin/categories");
  },
  create(input: Record<string, unknown>) {
    return apiRequest<{ category: AdminCategory }>("/admin/categories", {
      method: "POST",
      body: input,
    });
  },
  update(id: string, input: Record<string, unknown>) {
    return apiRequest<{ category: AdminCategory }>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: input,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/admin/categories/${id}`, { method: "DELETE" });
  },
};

export const adminDashboardApi = {
  getStats() {
    return apiRequest<DashboardStats>("/admin/dashboard/stats");
  },
};

export const adminOrdersApi = {
  list(params: { status?: OrderStatus; search?: string; page?: number; pageSize?: number } = {}) {
    return apiRequest<PaginatedResult<AdminOrderSummary>>(`/admin/orders${buildQuery(params)}`);
  },
  getById(id: string) {
    return apiRequest<{ order: AdminOrderDetail }>(`/admin/orders/${id}`);
  },
  updateStatus(id: string, status: OrderStatus, note?: string) {
    return apiRequest<{ order: AdminOrderDetail }>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: { status, note },
    });
  },
};

export const adminSellersApi = {
  list(params: { status?: SellerStatus; page?: number; pageSize?: number } = {}) {
    return apiRequest<PaginatedResult<AdminSeller>>(`/admin/sellers${buildQuery(params)}`);
  },
  getById(id: string) {
    return apiRequest<{ seller: AdminSeller }>(`/admin/sellers/${id}`);
  },
  approve(id: string) {
    return apiRequest<{ seller: AdminSeller }>(`/admin/sellers/${id}/approve`, { method: "PATCH" });
  },
  reject(id: string, reason?: string) {
    return apiRequest<{ seller: AdminSeller }>(`/admin/sellers/${id}/reject`, {
      method: "PATCH",
      body: { reason },
    });
  },
};

export const adminUsersApi = {
  list(params: { role?: string; search?: string; page?: number; pageSize?: number } = {}) {
    return apiRequest<PaginatedResult<AdminUser>>(`/admin/users${buildQuery(params)}`);
  },
  updateStatus(id: string, status: AdminUser["status"]) {
    return apiRequest<{ user: AdminUser }>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },
};

export const adminBlogApi = {
  list(params: { status?: "DRAFT" | "PUBLISHED"; page?: number; pageSize?: number } = {}) {
    return apiRequest<PaginatedResult<AdminBlogPost>>(`/admin/blog${buildQuery(params)}`);
  },
  getById(id: string) {
    return apiRequest<{ post: AdminBlogPost }>(`/admin/blog/${id}`);
  },
  create(input: Record<string, unknown>) {
    return apiRequest<{ post: AdminBlogPost }>("/admin/blog", { method: "POST", body: input });
  },
  update(id: string, input: Record<string, unknown>) {
    return apiRequest<{ post: AdminBlogPost }>(`/admin/blog/${id}`, { method: "PATCH", body: input });
  },
  remove(id: string) {
    return apiRequest<void>(`/admin/blog/${id}`, { method: "DELETE" });
  },
};

export const adminAuditLogApi = {
  list(params: { page?: number; pageSize?: number } = {}) {
    return apiRequest<PaginatedResult<AuditLogEntry>>(`/admin/audit-log${buildQuery(params)}`);
  },
};
