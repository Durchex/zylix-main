import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    address: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { addressService } from "@/services/address.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  address: {
    findMany: jest.Mock;
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    delete: jest.Mock;
  };
};

const baseInput = {
  fullName: "Ada Obi",
  phone: "08012345678",
  line1: "1 Marina Road",
  city: "Lagos",
  state: "Lagos",
  country: "Nigeria",
  type: "SHIPPING" as const,
  isDefault: false,
};

describe("addressService.list", () => {
  beforeEach(() => jest.clearAllMocks());

  it("scopes the query to the calling user", async () => {
    mockPrisma.address.findMany.mockResolvedValueOnce([]);
    await addressService.list("user_1");
    expect(mockPrisma.address.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
  });
});

describe("addressService.create", () => {
  beforeEach(() => jest.clearAllMocks());

  it("unsets other default addresses of the same type when creating a new default", async () => {
    mockPrisma.address.create.mockResolvedValueOnce({ id: "addr_2" });

    await addressService.create("user_1", { ...baseInput, isDefault: true });

    expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: "user_1", type: "SHIPPING", isDefault: true },
      data: { isDefault: false },
    });
  });

  it("does not touch other addresses when the new one isn't marked default", async () => {
    mockPrisma.address.create.mockResolvedValueOnce({ id: "addr_2" });

    await addressService.create("user_1", baseInput);

    expect(mockPrisma.address.updateMany).not.toHaveBeenCalled();
  });
});

describe("addressService.update", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws 404 when the address doesn't exist or belongs to a different user", async () => {
    mockPrisma.address.findUnique.mockResolvedValueOnce({ id: "addr_1", userId: "someone_else" });

    await expect(
      addressService.update("user_1", "addr_1", { fullName: "New Name" }),
    ).rejects.toThrow(ApiError);
    expect(mockPrisma.address.update).not.toHaveBeenCalled();
  });

  it("updates the address when owned by the calling user", async () => {
    mockPrisma.address.findUnique.mockResolvedValueOnce({
      id: "addr_1",
      userId: "user_1",
      type: "SHIPPING",
    });
    mockPrisma.address.update.mockResolvedValueOnce({ id: "addr_1", fullName: "New Name" });

    const result = await addressService.update("user_1", "addr_1", { fullName: "New Name" });
    expect(result).toMatchObject({ fullName: "New Name" });
  });

  it("unsets other defaults of the same type when the update marks this address default", async () => {
    mockPrisma.address.findUnique.mockResolvedValueOnce({
      id: "addr_1",
      userId: "user_1",
      type: "SHIPPING",
    });
    mockPrisma.address.update.mockResolvedValueOnce({ id: "addr_1", isDefault: true });

    await addressService.update("user_1", "addr_1", { isDefault: true });

    expect(mockPrisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: "user_1", type: "SHIPPING", isDefault: true, NOT: { id: "addr_1" } },
      data: { isDefault: false },
    });
  });
});

describe("addressService.remove", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws 404 when the address doesn't exist or belongs to a different user", async () => {
    mockPrisma.address.findUnique.mockResolvedValueOnce(null);
    await expect(addressService.remove("user_1", "addr_1")).rejects.toThrow(ApiError);
  });

  it("deletes the address when owned by the calling user", async () => {
    mockPrisma.address.findUnique.mockResolvedValueOnce({ id: "addr_1", userId: "user_1" });
    mockPrisma.address.delete.mockResolvedValueOnce({});

    await addressService.remove("user_1", "addr_1");
    expect(mockPrisma.address.delete).toHaveBeenCalledWith({ where: { id: "addr_1" } });
  });
});
