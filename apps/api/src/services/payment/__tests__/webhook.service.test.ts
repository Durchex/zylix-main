import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    payment: { findFirst: jest.fn(), update: jest.fn() },
    order: { update: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

const mockVerify = jest.fn();
jest.mock("@/services/payment", () => ({
  getPaymentProvider: () => ({ initiate: jest.fn(), verify: mockVerify }),
}));

import { paymentWebhookService } from "@/services/payment/webhook.service";

const mockPrisma = prisma as unknown as {
  payment: { findFirst: jest.Mock; update: jest.Mock };
  order: { update: jest.Mock };
};

describe("paymentWebhookService.confirmPayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is a no-op for an unknown payment reference (doesn't throw)", async () => {
    mockPrisma.payment.findFirst.mockResolvedValueOnce(null);
    await expect(paymentWebhookService.confirmPayment("FLUTTERWAVE", "unknown-ref")).resolves.toBeUndefined();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("is idempotent — does nothing for a payment already marked SUCCESS", async () => {
    mockPrisma.payment.findFirst.mockResolvedValueOnce({ id: "payment_1", status: "SUCCESS", orderId: "order_1" });
    await paymentWebhookService.confirmPayment("FLUTTERWAVE", "ref-1");
    expect(mockVerify).not.toHaveBeenCalled();
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it("marks the payment FAILED when the provider's verification doesn't confirm success", async () => {
    mockPrisma.payment.findFirst.mockResolvedValueOnce({ id: "payment_1", status: "PENDING", orderId: "order_1" });
    mockVerify.mockResolvedValueOnce({ success: false });

    await paymentWebhookService.confirmPayment("FLUTTERWAVE", "ref-1");

    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: { status: "FAILED" },
    });
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it("marks the payment SUCCESS and the order PAID when verification confirms success", async () => {
    mockPrisma.payment.findFirst.mockResolvedValueOnce({ id: "payment_1", status: "PENDING", orderId: "order_1" });
    mockVerify.mockResolvedValueOnce({ success: true });

    await paymentWebhookService.confirmPayment("FLUTTERWAVE", "ref-1");

    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: { status: "SUCCESS" },
    });
    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order_1" },
        data: expect.objectContaining({ status: "PAID" }),
      }),
    );
  });

  it("never trusts the webhook payload alone — always re-verifies with the provider", async () => {
    mockPrisma.payment.findFirst.mockResolvedValueOnce({ id: "payment_1", status: "PENDING", orderId: "order_1" });
    mockVerify.mockResolvedValueOnce({ success: true });

    await paymentWebhookService.confirmPayment("PAYSTACK", "ref-1");

    expect(mockVerify).toHaveBeenCalledWith("ref-1");
  });
});
