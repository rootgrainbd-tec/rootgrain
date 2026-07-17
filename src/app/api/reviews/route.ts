import { withAuth, successResponse } from "@/lib/api-utils";
import { ReviewService } from "@/services/review.service";
import { AppError } from "@/lib/errors/AppError";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) throw new AppError("Missing product ID", 400);

  const reviews = await ReviewService.getProductReviews(productId);
  return successResponse({ reviews });
}

export const POST = withAuth(async (req, ctx, session) => {
  const body = await req.json();
  const review = await ReviewService.createReview(session.user.id, body);
  return successResponse({ review }, "Review submitted successfully");
});
