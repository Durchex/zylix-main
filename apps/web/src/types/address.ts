export type AddressType = "SHIPPING" | "BILLING";

export interface Address {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  type: AddressType;
  isDefault: boolean;
  createdAt: string;
}

export interface AddressInput {
  label?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
  type?: AddressType;
  isDefault?: boolean;
}
