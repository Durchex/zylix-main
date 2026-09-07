import { NextResponse } from "next/server";
import { withRoute, readJson } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { addressService } from "@/server/services/address.service";
import { updateAddressSchema } from "@/server/validation/address.schema";

export const PATCH = withRoute(async (req, { params }) => {
  const user = requireAuth(req);
  const input = updateAddressSchema.parse(await readJson(req));
  const address = await addressService.update(user.id, params.addressId, input);
  return { address };
});

export const DELETE = withRoute(async (req, { params }) => {
  const user = requireAuth(req);
  await addressService.remove(user.id, params.addressId);
  return new NextResponse(null, { status: 204 });
});
