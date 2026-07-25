import crypto from "crypto";

jest.mock("@/config/env", () => ({
  env: { PAYSTACK_SECRET_KEY: "test-secret" },
}));

import { paystackProvider, verifyPaystackWebhookSignature } from "@/services/payment/paystack.provider";
import { env } from "@/config/env";
import { ApiError } from "@/middleware/errorHandler";

const mockEnv = env as unknown as { PAYSTACK_SECRET_KEY?: string };

function jsonResponse(ok: boolean, body: unknown) {
  return { ok, json: async () => body } as Response;
}

const baseParams = {
  orderId: "order_1",
  orderNumber: "ZLX-ABCD1234",
  amount: 50000,
  currency: "NGN",
  email: "ada@example.com",
  redirectUrl: "https://zylix.example/checkout/confirmation/order_1",
};

describe("paystackProvider.initiate", () => {
  beforeEach(() => {
    mockEnv.PAYSTACK_SECRET_KEY = "test-secret";
    global.fetch = jest.fn();
  });

  it("throws a 503 when no secret key is configured", async () => {
    mockEnv.PAYSTACK_SECRET_KEY = undefined;
    await expect(paystackProvider.initiate(baseParams)).rejects.toThrow(ApiError);
  });

  it("converts the amount to kobo (smallest currency unit) for Paystack", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(true, { status: true, data: { authorization_url: "https://checkout.paystack.com/abc" } }),
    );

    await paystackProvider.initiate(baseParams);

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody.amount).toBe(5_000_000); // 50000 * 100
  });

  it("returns the hosted checkout link on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(true, { status: true, data: { authorization_url: "https://checkout.paystack.com/abc" } }),
    );

    const result = await paystackProvider.initiate(baseParams);
    expect(result.checkoutUrl).toBe("https://checkout.paystack.com/abc");
    expect(result.providerRef).toMatch(/^ZLX-PSK-/);
  });
});

describe("paystackProvider.verify", () => {
  beforeEach(() => {
    mockEnv.PAYSTACK_SECRET_KEY = "test-secret";
    global.fetch = jest.fn();
  });

  it("converts the returned amount back from kobo to naira", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(true, { status: true, data: { status: "success", amount: 5_000_000, currency: "NGN" } }),
    );

    const result = await paystackProvider.verify("ZLX-PSK-abc");
    expect(result.success).toBe(true);
    expect(result.amount).toBe(50000);
  });
});

describe("verifyPaystackWebhookSignature", () => {
  const rawBody = JSON.stringify({ event: "charge.success", data: { reference: "ZLX-PSK-abc" } });

  beforeEach(() => {
    mockEnv.PAYSTACK_SECRET_KEY = "test-secret";
  });

  it("returns true for a correctly computed HMAC-SHA512 signature", () => {
    const validSignature = crypto.createHmac("sha512", "test-secret").update(rawBody).digest("hex");
    expect(verifyPaystackWebhookSignature(rawBody, validSignature)).toBe(true);
  });

  it("returns false for a tampered body against the original signature", () => {
    const validSignature = crypto.createHmac("sha512", "test-secret").update(rawBody).digest("hex");
    const tamperedBody = JSON.stringify({ event: "charge.success", data: { reference: "ZLX-PSK-HACKED" } });
    expect(verifyPaystackWebhookSignature(tamperedBody, validSignature)).toBe(false);
  });

  it("returns false when no secret key is configured", () => {
    mockEnv.PAYSTACK_SECRET_KEY = undefined;
    const signature = crypto.createHmac("sha512", "test-secret").update(rawBody).digest("hex");
    expect(verifyPaystackWebhookSignature(rawBody, signature)).toBe(false);
  });
});
