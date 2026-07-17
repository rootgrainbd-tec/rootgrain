import { withAuth, successResponse } from "@/lib/api-utils";
import { userService } from "@/services/user.service";

export const PUT = withAuth(async (req, { params }: { params: Promise<{ id: string }> }, session) => {
  const { id } = await params;
  const data = await req.json();
  
  const address = await userService.updateAddress(id, session.user.id, data);
  return successResponse({ address });
});

export const DELETE = withAuth(async (req, { params }: { params: Promise<{ id: string }> }, session) => {
  const { id } = await params;
  
  await userService.deleteAddress(id, session.user.id);
  return successResponse(null, "Address deleted");
});
