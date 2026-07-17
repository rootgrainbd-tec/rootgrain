import { withAuth, successResponse } from "@/lib/api-utils";
import { userService } from "@/services/user.service";

export const POST = withAuth(async (request, ctx, session) => {
  const { currentPassword, newPassword } = await request.json();

  await userService.changePassword(session.user.id, currentPassword, newPassword);

  return successResponse(null, "Password updated successfully");
});
