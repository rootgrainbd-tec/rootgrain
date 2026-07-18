import "server-only";
import { ReviewRepository } from "@/repositories/review.repository";
import { AppError } from "@/lib/errors/AppError";

export class ReviewService {
  static async getProductReviews(productId: string) {
    if (!productId) {
      throw new AppError("Missing product ID", 400);
    }
    return ReviewRepository.getApprovedByProduct(productId);
  }

  static async createReview(
    userId: string,
    data: { productId?: string; rating?: number | string; comment?: string }
  ) {
    if (!userId) throw new AppError("Authentication required", 401);
    if (!data.productId || !data.rating) {
      throw new AppError("Product ID and Rating are required", 400);
    }

    const rating = typeof data.rating === "string" ? parseInt(data.rating, 10) : data.rating;

    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const existing = await ReviewRepository.findByUserAndProduct(userId, data.productId);
    if (existing) {
      throw new AppError("You have already reviewed this product", 400);
    }

    return ReviewRepository.create({
      userId,
      productId: data.productId,
      rating,
      comment: data.comment || "",
    });
  }
}
