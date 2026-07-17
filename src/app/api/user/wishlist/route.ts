import { withAuth, successResponse } from "@/lib/api-utils";
import { userService } from "@/services/user.service";

export const GET = withAuth(async (req, ctx, session) => {
  const wishlistItems = await userService.getWishlist(session.user.id);
  return successResponse({ wishlistItems });
});

export const POST = withAuth(async (req, ctx, session) => {
  const data = await req.json();
  const wishlistItem = await userService.addWishlistItem(session.user.id, data.productId);
  return successResponse({ wishlistItem });
});
