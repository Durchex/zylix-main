export type Role = "CUSTOMER" | "SELLER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: string;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  twoFactorEnabled: boolean;
  preferredCurrency: string;
  preferredLocale: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}
