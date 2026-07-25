import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
    orderItem: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

import { sellerOrderService } from "@/services/seller/order.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  order: { findMany: jest.Mock; count: jest.Mock; findFirst: jest.Mock };
  orderItem: { findUnique: jest.Mock; update: jest.Mock };
};

describe("sellerOrderService.list", () => {
  it("scopes the query to orders containing this seller's items", async () => {
    mockPrisma.order.findMany.mockResolvedValueOnce([]);
    mockPrisma.order.count.mockResolvedValueOnce(0);

    await sellerOrderService.list("seller_ME", { page: 1, pageSize: 20 });

    const where = mockPrisma.order.findMany.mock.calls[0][0].where;
    expect(where).toEqual({ items: { some: { sellerId: "seller_ME" } } });

    const itemsInclude = mockPrisma.order.findMany.mock.calls[0][0].include.items;
    expect(itemsInclude).toEqual({ where: { sellerId: "seller_ME" } });
  });
});

describe("sellerOrderService.getById", () => {
  it("throws 404 for an order with none of this seller's items", async () => {
    mockPrisma.order.findFirst.mockResolvedValueOnce(null);
    await expect(sellerOrderService.getById("seller_ME", "order_1")).rejects.toThrow(ApiError);
  });
});

describe("sellerOrderService.updateItemFulfillment", () => {
  it("throws 404 when the item belongs to a different seller", async () => {
    mockPrisma.orderItem.findUnique.mockResolvedValueOnce({
      id: "item_1",
      orderId: "order_1",
      sellerId: "seller_OTHER",
    });

    await expect(
      sellerOrderService.updateItemFulfillment("seller_ME", "order_1", "item_1", {
        fulfillmentStatus: "SHIPPED",
      }),
    ).rejects.toThrow(ApiError);
    expect(mockPrisma.orderItem.update).not.toHaveBeenCalled();
  });

  it("throws 404 when the item belongs to a different order (cross-order tampering)", async () => {
    mockPrisma.orderItem.findUnique.mockResolvedValueOnce({
      id: "item_1",
      orderId: "order_OTHER",
      sellerId: "seller_ME",
    });

    await expect(
      sellerOrderService.updateItemFulfillment("seller_ME", "order_1", "item_1", {
        fulfillmentStatus: "SHIPPED",
      }),
    ).rejects.toThrow(ApiError);
  });

  it("updates fulfillment status when the item belongs to this seller and order", async () => {
    mockPrisma.orderItem.findUnique.mockResolvedValueOnce({
      id: "item_1",
      orderId: "order_1",
      sellerId: "seller_ME",
    });
    mockPrisma.orderItem.update.mockResolvedValueOnce({ id: "item_1", fulfillmentStatus: "SHIPPED" });

    await sellerOrderService.updateItemFulfillment("seller_ME", "order_1", "item_1", {
      fulfillmentStatus: "SHIPPED",
    });

    expect(mockPrisma.orderItem.update).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { fulfillmentStatus: "SHIPPED" },
    });
  });
});
