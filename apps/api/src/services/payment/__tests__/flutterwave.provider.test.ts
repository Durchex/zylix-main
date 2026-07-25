jest.mock("@/config/env", () => ({
  env: {
    FLUTTERWAVE_SECRET_KEY: "test-secret",
    FLUTTERWAVE_WEBHOOK_SECRET_HASH: "correct-hash",
  },
}));

import { flutterwaveProvider, verifyFlutterwaveWebhookSignature } from "@/services/payment/flutterwave.provider";
import { env } from "@/config/env";
import { ApiError } from "@/middleware/errorHandler";

const mockEnv = env as unknown as { FLUTTERWAVE_SECRET_KEY?: string; FLUTTERWAVE_WEBHOOK_SECRET_HASH?: string };

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

describe("flutterwaveProvider.initiate", () => {
  beforeEach(() => {
    mockEnv.FLUTTERWAVE_SECRET_KEY = "test-secret";
    global.fetch = jest.fn();
  });

  it("throws a 503 when no secret key is configured", async () => {
    mockEnv.FLUTTERWAVE_SECRET_KEY = undefined;
    await expect(flutterwaveProvider.initiate(baseParams)).rejects.toThrow(ApiError);
  });

  it("returns the hosted checkout link on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(true, { status: "success", data: { link: "https://checkout.flutterwave.com/pay/abc" } }),
    );

    const result = await flutterwaveProvider.initiate(baseParams);

    expect(result.checkoutUrl).toBe("https://checkout.flutterwave.com/pay/abc");
    expect(result.status).toBe("PENDING");
    expect(result.providerRef).toMatch(/^ZLX-FLW-/);
  });

  it("throws a 502 when Flutterwave rejects the request", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(false, { status: "error", message: "bad request" }));

    await expect(flutterwaveProvider.initiate(baseParams)).rejects.toThrow(ApiError);
  });
});

describe("flutterwaveProvider.verify", () => {
  beforeEach(() => {
    mockEnv.FLUTTERWAVE_SECRET_KEY = "test-secret";
    global.fetch = jest.fn();
  });

  it("reports success only when Flutterwave's transaction status is 'successful'", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(true, { status: "success", data: { status: "successful", amount: 50000, currency: "NGN" } }),
    );

    const result = await flutterwaveProvider.verify("ZLX-FLW-abc");
    expect(result.success).toBe(true);
  });

  it("reports failure for a pending or failed transaction", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(true, { status: "success", data: { status: "failed", amount: 50000, currency: "NGN" } }),
    );

    const result = await flutterwaveProvider.verify("ZLX-FLW-abc");
    expect(result.success).toBe(false);
  });
});

describe("verifyFlutterwaveWebhookSignature", () => {
  beforeEach(() => {
    mockEnv.FLUTTERWAVE_WEBHOOK_SECRET_HASH = "correct-hash";
  });

  it("returns false when no secret hash is configured", () => {
    mockEnv.FLUTTERWAVE_WEBHOOK_SECRET_HASH = undefined;
    expect(verifyFlutterwaveWebhookSignature("anything")).toBe(false);
  });

  it("returns false for a mismatched header", () => {
    expect(verifyFlutterwaveWebhookSignature("wrong-hash")).toBe(false);
  });

  it("returns true for a matching header", () => {
    expect(verifyFlutterwaveWebhookSignature("correct-hash")).toBe(true);
  });
});
