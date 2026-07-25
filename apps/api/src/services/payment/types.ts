export interface InitiatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  email: string;
  userId?: string;
  redirectUrl: string;
}

export interface InitiatePaymentResult {
  providerRef: string;
  status: "PENDING" | "SUCCESS";
  checkoutUrl?: string;
  clientSecret?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  providerRef: string;
  amount: number;
  currency: string;
  raw: unknown;
}

export interface PaymentProviderAdapter {
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verify(providerRef: string): Promise<VerifyPaymentResult>;
}
