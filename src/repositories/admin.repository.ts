import prisma from "@/lib/prisma";
import { ReviewStatus, DiscountType } from "@prisma/client";

export class AdminRepository {
  // --- Coupons ---
  async getCoupons() {
    return prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCoupon(data: { code: string, discountType: DiscountType, discountValue: number, maxUses: number | null, expiryDate: Date | null }) {
    return prisma.promoCode.create({ data });
  }

  async updateCouponStatus(id: string, isActive: boolean) {
    return prisma.promoCode.update({
      where: { id },
      data: { isActive }
    });
  }

  async deleteCoupon(id: string) {
    return prisma.promoCode.delete({
      where: { id }
    });
  }

  // --- Reviews ---
  async getReviews() {
    return prisma.review.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateReviewStatus(id: string, status: ReviewStatus) {
    return prisma.review.update({
      where: { id },
      data: { status }
    });
  }

  // --- Shipping ---
  async getShippingRates() {
    return prisma.shippingRate.findMany({
      orderBy: { district: 'asc' }
    });
  }

  async upsertShippingRate(district: string, baseRate: number, perItemRate: number) {
    return prisma.shippingRate.upsert({
      where: { district },
      update: { baseRate, perItemRate },
      create: { district, baseRate, perItemRate },
    });
  }

  async deleteShippingRate(id: string) {
    return prisma.shippingRate.delete({
      where: { id },
    });
  }
  // --- Settings ---
  async getStoreSettings() {
    return prisma.storeSettings.findFirst();
  }

  async updateStoreSettings(id: string, data: any) {
    return prisma.storeSettings.update({
      where: { id },
      data
    });
  }

  async createStoreSettings(data: any) {
    return prisma.storeSettings.create({ data });
  }
}

export const adminRepository = new AdminRepository();
