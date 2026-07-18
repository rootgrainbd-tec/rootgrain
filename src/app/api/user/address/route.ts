import { withAuth, successResponse } from "@/lib/api-utils";
import { userService } from "@/services/user.service";

export const GET = withAuth(async (req, ctx, session) => {
  const addresses = await userService.getAddresses(session.user.id);
  return successResponse({ addresses });
});

export const POST = withAuth(async (req, ctx, session) => {
  const data = await req.json();
  const address = await userService.createAddress(session.user.id, data);
  return successResponse({ address }, "Address created");
});
