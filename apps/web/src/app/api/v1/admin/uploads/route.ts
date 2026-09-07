import { withRoute } from "@/server/http/route";
import { requireRole } from "@/server/http/auth";
import { readImageUpload, uploadImage } from "@/server/lib/cloudinary";

export const POST = withRoute(
  async (req) => {
    requireRole(req, "ADMIN");
    const buffer = await readImageUpload(req);
    return uploadImage(buffer);
  },
  { status: 201 },
);
