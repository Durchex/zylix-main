import "server-only";
import { ApiError } from "@/server/http/errors";
import { Address, type AddressDoc } from "@/server/models";
import type { AddressInput, UpdateAddressInput } from "@/server/validation/address.schema";

function toDto(address: AddressDoc) {
  return { ...address, id: String(address._id), userId: String(address.userId) };
}

export const addressService = {
  async list(userId: string) {
    // Only addresses the customer chose to keep. Checkout writes an Address
    // for every order (the Order references one by id), so without this
    // filter the address book filled up with one entry per order placed.
    const addresses = await Address.find({ userId, isSavedToAddressBook: true })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean<AddressDoc[]>();
    return addresses.map(toDto);
  },

  async create(userId: string, input: AddressInput) {
    if (input.isDefault) {
      await Address.updateMany({ userId, type: input.type, isDefault: true }, { isDefault: false });
    }
    // Anything created through this service is an explicit "save my address".
    const created = await Address.create({ userId, ...input, isSavedToAddressBook: true });
    return toDto(created.toObject() as AddressDoc);
  },

  async update(userId: string, addressId: string, input: UpdateAddressInput) {
    const existing = await Address.findById(addressId).lean<AddressDoc>();
    if (!existing || String(existing.userId) !== userId) {
      throw new ApiError(404, "Address not found");
    }

    if (input.isDefault) {
      const type = input.type ?? existing.type;
      await Address.updateMany(
        { userId, type, isDefault: true, _id: { $ne: addressId } },
        { isDefault: false },
      );
    }

    const updated = await Address.findByIdAndUpdate(addressId, input, { new: true }).lean<AddressDoc>();
    return toDto(updated as AddressDoc);
  },

  async remove(userId: string, addressId: string) {
    const existing = await Address.findById(addressId).lean<AddressDoc>();
    if (!existing || String(existing.userId) !== userId) {
      throw new ApiError(404, "Address not found");
    }
    await Address.deleteOne({ _id: addressId });
  },
};
