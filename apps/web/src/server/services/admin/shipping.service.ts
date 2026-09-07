import "server-only";
import { Types } from "mongoose";
import { ApiError } from "@/server/http/errors";
import { ShippingZone } from "@/server/models";
import type {
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
} from "@/server/validation/admin/shipping.schema";

function toDto(zone: { _id: unknown }) {
  return { ...zone, id: String(zone._id) };
}

export const adminShippingService = {
  async list() {
    const zones = await ShippingZone.find().sort({ createdAt: 1 }).lean();
    return zones.map(toDto);
  },

  async create(input: CreateShippingZoneInput) {
    if (input.isDefault) {
      await ShippingZone.updateMany({}, { isDefault: false });
    }
    const zone = await ShippingZone.create(input);
    return toDto(zone.toObject());
  },

  async update(id: string, input: UpdateShippingZoneInput) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Shipping zone not found");
    }
    const existing = await ShippingZone.findById(id).lean();
    if (!existing) {
      throw new ApiError(404, "Shipping zone not found");
    }
    if (input.isDefault) {
      await ShippingZone.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }
    const updated = await ShippingZone.findByIdAndUpdate(id, input, { new: true }).lean();
    return toDto(updated as NonNullable<typeof updated>);
  },

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(404, "Shipping zone not found");
    }
    const existing = await ShippingZone.findById(id).lean();
    if (!existing) {
      throw new ApiError(404, "Shipping zone not found");
    }
    await ShippingZone.deleteOne({ _id: id });
  },
};
