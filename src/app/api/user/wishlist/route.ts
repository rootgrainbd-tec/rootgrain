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
    const toggleResult = await userService.toggleWishlistItem(session.user.id, data.productId);
    
    console.log(`[API] returned result:`, toggleResult);
    // Keep response contract identical: { wishlistItem: item, action: 'added' | 'removed' }
    return successResponse({ wishlistItem: toggleResult.item, action: toggleResult.action });
  } catch (error) {
    console.log(`[API] thrown exception:`, error);
    throw error;
  }
});
