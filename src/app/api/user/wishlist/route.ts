import { withAuth, successResponse } from "@/lib/api-utils";
import { userService } from "@/services/user.service";

export const GET = withAuth(async (req, ctx, session) => {
  const wishlistItems = await userService.getWishlist(session.user.id);
  return successResponse({ wishlistItems });
});

export const POST = withAuth(async (req, ctx, session) => {
  console.log(`\n[API] POST /api/user/wishlist`);
  console.log(`[API] request entered`);
  console.log(`[API] authenticated user id: ${session.user?.id}`);
  
  try {
    const data = await req.json();
    console.log(`[API] parsed productId: ${data.productId}`);
    
    console.log(`[API] calling repository/service...`);
    const wishlistItem = await userService.addWishlistItem(session.user.id, data.productId);
    
    console.log(`[API] returned result:`, wishlistItem);
    return successResponse({ wishlistItem });
  } catch (error) {
    console.log(`[API] thrown exception:`, error);
    throw error;
  }
});
