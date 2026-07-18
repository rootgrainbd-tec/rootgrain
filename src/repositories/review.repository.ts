import "server-only";
import prisma from "@/lib/prisma";
import { ReviewStatus } from "@prisma/client";

export class ReviewRepository {
  static async getApprovedByProduct(productId: string) {
    return prisma.review.findMany({
      where: { productId, status: ReviewStatus.APPROVED },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async findByUserAndProduct(userId: string, productId: string) {
    return prisma.review.findFirst({
      where: { userId, productId },
    });
  }

  static async create(data: {
    userId: string;
    productId: string;
    rating: number;
    comment: string;
  }) {
    return prisma.review.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        status: ReviewStatus.PENDING,
      }
    });
  }
}
