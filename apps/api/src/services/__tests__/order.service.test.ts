import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUniqueOrThrow: jest.fn() },
    product: { findMany: jest.fn(), update: jest.fn() },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    payment: { update: jest.fn() },
    $transaction: jest.fn((arg: unknown) => {
      // order.service.ts calls $transaction two different ways: with a
      // callback (order creation / rollback) and, in other services, with
      // an array of promises — only the callback form is used here.
      if (typeof arg === "function") {
        return (arg as (tx: unknown) => unknown)(mockTx());
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
  },
}));

function mockTx() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("@/lib/prisma").prisma;
}

const mockInitiate = jest.fn();
jest.mock("@/services/payment", () => ({
  getPaymentProvider: () => ({ initiate: mockInitiate, verify: jest.fn() }),
}));

import { orderService } from "@/services/order.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  user: { findUniqueOrThrow: jest.Mock };
  product: { findMany: jest.Mock; update: jest.Mock };
  order: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
  };
  payment: { update: jest.Mock };
  address: { create: jest.Mock };
  productVariant: { update: jest.Mock };
};

// $transaction resolves the same mocked `prisma` object as `tx`, so these
// extra collections need mocks too even though they're never called directly.
(mockPrisma as unknown as Record<string, unknown>).address = { create: jest.fn() };
(mockPrisma as unknown as Record<string, unknown>).productVariant = { update: jest.fn() };
(mockPrisma.order as unknown as Record<string, unknown>).create = jest.fn();

const shippingAddress = {
  fullName: "Ada Obi",
  phone: "08012345678",
  line1: "12 Marina Road",
  city: "Lagos",
  state: "Lagos",
  country: "Nigeria",
};

function buildActiveProduct(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "prod_1",
    name: "iPhone 16 Pro",
    sku: "IPH16PRO",
    sellerId: "seller_1",
    basePrice: { mul: (n: number) => ({ toString: () => String(1_250_000 * n) }), toString: () => "1250000" },
    stockQuantity: 10,
    variants: [],
    ...overrides,
  };
}

describe("orderService.createOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ email: "ada@example.com" });
    mockPrisma.address.create.mockResolvedValue({ id: "addr_1" });
    mockPrisma.order.create.mockResolvedValue({
      id: "order_1",
      orderNumber: "ZLX-ABCD1234",
      currency: "NGN",
      payments: [{ id: "payment_1" }],
    });
    mockPrisma.productVariant.update.mockResolvedValue({});
    mockPrisma.product.update.mockResolvedValue({});
    mockPrisma.payment.update.mockResolvedValue({});
    mockPrisma.order.update.mockResolvedValue({});
    mockInitiate.mockResolvedValue({ providerRef: "ZLX-FLW-abc123", status: "PENDING", checkoutUrl: "https://pay.example/abc" });
  });

  it("rejects an order referencing a product that doesn't exist or isn't active", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([]);

    await expect(
      orderService.createOrder("user_1", {
        items: [{ productId: "prod_missing", quantity: 1 }],
        shippingAddress,
        paymentProvider: "FLUTTERWAVE",
      }),
    ).rejects.toThrow(ApiError);
  });

  it("rejects an order when requested quantity exceeds variant stock", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([
      buildActiveProduct({
        variants: [{ id: "var_1", sku: "IPH16PRO-256", price: { toString: () => "1250000" }, compareAtPrice: null, stockQuantity: 2, isDefault: true }],
      }),
    ]);

    await expect(
      orderService.createOrder("user_1", {
        items: [{ productId: "prod_1", variantId: "var_1", quantity: 5 }],
        shippingAddress,
        paymentProvider: "FLUTTERWAVE",
      }),
    ).rejects.toThrow(ApiError);
  });

  it("creates the order, decrements stock, and returns the provider's checkout URL", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([
      buildActiveProduct({
        variants: [
          {
            id: "var_1",
            sku: "IPH16PRO-256",
            price: { toString: () => "1250000", mul: (n: number) => ({ toString: () => String(1_250_000 * n) }) },
            compareAtPrice: null,
            stockQuantity: 10,
            isDefault: true,
          },
        ],
      }),
    ]);

    const result = await orderService.createOrder("user_1", {
      items: [{ productId: "prod_1", variantId: "var_1", quantity: 2 }],
      shippingAddress,
      paymentProvider: "FLUTTERWAVE",
    });

    expect(result).toMatchObject({
      orderId: "order_1",
      orderNumber: "ZLX-ABCD1234",
      checkoutUrl: "https://pay.example/abc",
      status: "PENDING",
    });
    expect(mockPrisma.productVariant.update).toHaveBeenCalledWith({
      where: { id: "var_1" },
      data: { stockQuantity: { decrement: 2 } },
    });
  });

  it("marks the order PAID immediately when the provider settles synchronously (e.g. Wallet)", async () => {
    mockInitiate.mockResolvedValueOnce({ providerRef: "ZLX-WLT-xyz", status: "SUCCESS" });
    mockPrisma.product.findMany.mockResolvedValueOnce([buildActiveProduct()]);

    await orderService.createOrder("user_1", {
      items: [{ productId: "prod_1", quantity: 1 }],
      shippingAddress,
      paymentProvider: "WALLET",
    });

    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }),
    );
  });

  it("rejects an order for a variant-less product when quantity exceeds product.stockQuantity", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([buildActiveProduct({ stockQuantity: 2 })]);

    await expect(
      orderService.createOrder("user_1", {
        items: [{ productId: "prod_1", quantity: 5 }],
        shippingAddress,
        paymentProvider: "FLUTTERWAVE",
      }),
    ).rejects.toThrow(ApiError);
  });

  it("decrements product.stockQuantity directly for a variant-less product", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([buildActiveProduct({ stockQuantity: 10 })]);

    await orderService.createOrder("user_1", {
      items: [{ productId: "prod_1", quantity: 3 }],
      shippingAddress,
      paymentProvider: "FLUTTERWAVE",
    });

    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: "prod_1" },
      data: { stockQuantity: { decrement: 3 } },
    });
  });

  it("unwinds the order and restores stock when payment initiation fails", async () => {
    mockPrisma.product.findMany.mockResolvedValueOnce([
      buildActiveProduct({
        variants: [
          {
            id: "var_1",
            sku: "IPH16PRO-256",
            price: { toString: () => "1250000", mul: (n: number) => ({ toString: () => String(1_250_000 * n) }) },
            compareAtPrice: null,
            stockQuantity: 10,
            isDefault: true,
          },
        ],
      }),
    ]);
    mockInitiate.mockRejectedValueOnce(new ApiError(400, "Insufficient wallet balance"));

    await expect(
      orderService.createOrder("user_1", {
        items: [{ productId: "prod_1", variantId: "var_1", quantity: 2 }],
        shippingAddress,
        paymentProvider: "WALLET",
      }),
    ).rejects.toThrow(ApiError);

    expect(mockPrisma.productVariant.update).toHaveBeenCalledWith({
      where: { id: "var_1" },
      data: { stockQuantity: { increment: 2 } },
    });
    expect(mockPrisma.order.delete).toHaveBeenCalledWith({ where: { id: "order_1" } });
  });
});

describe("orderService.getConfirmation", () => {
  it("throws 404 for an unknown order id", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce(null);
    await expect(orderService.getConfirmation("does-not-exist")).rejects.toThrow(ApiError);
  });

  it("returns only the non-sensitive confirmation fields", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      orderNumber: "ZLX-ABCD1234",
      total: { toString: () => "2500000" },
      currency: "NGN",
      status: "PAID",
    });

    const result = await orderService.getConfirmation("order_1");
    expect(result).toEqual({
      orderNumber: "ZLX-ABCD1234",
      total: "2500000",
      currency: "NGN",
      status: "PAID",
    });
  });
});

describe("orderService.track", () => {
  it("throws 404 when the email doesn't match the order's guest or account email", async () => {
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      orderNumber: "ZLX-ABCD1234",
      status: "PROCESSING",
      placedAt: new Date(),
      guestEmail: null,
      user: { email: "owner@example.com" },
    });

    await expect(orderService.track("ZLX-ABCD1234", "wrong@example.com")).rejects.toThrow(ApiError);
  });

  it("returns the order status when the email matches", async () => {
    const placedAt = new Date();
    mockPrisma.order.findUnique.mockResolvedValueOnce({
      orderNumber: "ZLX-ABCD1234",
      status: "PROCESSING",
      placedAt,
      guestEmail: null,
      user: { email: "owner@example.com" },
    });

    const result = await orderService.track("ZLX-ABCD1234", "owner@example.com");
    expect(result).toMatchObject({ orderNumber: "ZLX-ABCD1234", status: "PROCESSING" });
  });
});

describe("orderService.listMine", () => {
  it("scopes the query to the calling user's own orders", async () => {
    mockPrisma.order.findMany.mockResolvedValueOnce([{ id: "order_1", userId: "user_1" }]);
    mockPrisma.order.count.mockResolvedValueOnce(1);

    const result = await orderService.listMine("user_1", { page: 1, pageSize: 10 });

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe("orderService.getMineById", () => {
  it("throws 404 when the order doesn't exist or belongs to a different user", async () => {
    mockPrisma.order.findFirst.mockResolvedValueOnce(null);

    await expect(orderService.getMineById("user_1", "order_other_users")).rejects.toThrow(ApiError);
    expect(mockPrisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "order_other_users", userId: "user_1" } }),
    );
  });

  it("returns the order when it belongs to the calling user", async () => {
    mockPrisma.order.findFirst.mockResolvedValueOnce({ id: "order_1", userId: "user_1" });

    const result = await orderService.getMineById("user_1", "order_1");
    expect(result).toMatchObject({ id: "order_1" });
  });
});
