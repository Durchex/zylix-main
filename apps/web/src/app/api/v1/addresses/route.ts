import { withRoute, readJson } from "@/server/http/route";
import { requireAuth } from "@/server/http/auth";
import { addressService } from "@/server/services/address.service";
import { addressInputSchema } from "@/server/validation/address.schema";

export const GET = withRoute(async (req) => {
  const user = requireAuth(req);
  const addresses = await addressService.list(user.id);
  return { addresses };
});

export const POST = withRoute(
  async (req) => {
    const user = requireAuth(req);
    const input = addressInputSchema.parse(await readJson(req));
    const address = await addressService.create(user.id, input);
    return { address };
  },
  { status: 201 },
);
