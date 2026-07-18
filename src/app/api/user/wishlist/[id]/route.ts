import { withAuth, successResponse } from "@/lib/api-utils";
import { userService } from "@/services/user.service";

export const DELETE = withAuth(async (req, { params }: { params: Promise<{ id: string }> }, session) => {
  const { id } = await params;
  
  await userService.removeWishlistItem(id, session.user.id);
  return successResponse(null, "Wishlist item deleted");
});
