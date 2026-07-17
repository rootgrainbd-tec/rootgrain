import { withAuth, successResponse } from "@/lib/api-utils";
import { userService } from "@/services/user.service";

export const PUT = withAuth(async (req, ctx, session) => {
  const data = await req.json();
  const user = await userService.updateProfile(session.user.id, data);
  return successResponse({ user });
});
