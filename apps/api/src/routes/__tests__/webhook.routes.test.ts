import request from "supertest";

jest.mock("@/lib/prisma", () => ({
  prisma: { payment: { findFirst: jest.fn() }, $queryRaw: jest.fn() },
}));

jest.mock("@/lib/redis", () => ({
  redis: { ping: jest.fn().mockResolvedValue("PONG"), disconnect: jest.fn() },
}));

jest.mock("@/config/env", () => ({
  env: {
    NODE_ENV: "test",
    APP_URL: "http://localhost:3000",
    FLUTTERWAVE_WEBHOOK_SECRET_HASH: "correct-hash",
    PAYSTACK_SECRET_KEY: "test-secret",
    STRIPE_WEBHOOK_SECRET: undefined,
  },
}));

import { createApp } from "@/app";

const app = createApp();

describe("POST /api/v1/webhooks/flutterwave", () => {
  it("rejects a request with a missing or wrong verif-hash header", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/flutterwave")
      .set("Content-Type", "application/json")
      .send({ data: { tx_ref: "ZLX-FLW-abc" } });

    expect(res.status).toBe(401);
  });

  it("accepts a request with the correct verif-hash header", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/flutterwave")
      .set("Content-Type", "application/json")
      .set("verif-hash", "correct-hash")
      .send({ data: { tx_ref: "ZLX-FLW-abc" } });

    expect(res.status).toBe(200);
  });
});

describe("POST /api/v1/webhooks/paystack", () => {
  it("rejects a request with a missing or wrong signature header", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/paystack")
      .set("Content-Type", "application/json")
      .send({ event: "charge.success", data: { reference: "ZLX-PSK-abc" } });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/webhooks/stripe", () => {
  it("returns 503 (not 401) when Stripe isn't configured, rather than masquerading as a signature failure", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "whatever")
      .send({ type: "checkout.session.completed" });

    expect(res.status).toBe(503);
  });
});
