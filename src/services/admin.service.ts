import { adminRepository } from "@/repositories/admin.repository";
import { AppError } from "@/lib/errors/AppError";
import { ReviewStatus, DiscountType } from "@prisma/client";

export class AdminService {
  // --- Coupons ---
  async getCoupons() {
    return adminRepository.getCoupons();
  }

  async createCoupon(data: { code: string, discountType: DiscountType, discountValue: number, maxUses: number | null, expiryDate: Date | null }) {
    try {
      return await adminRepository.createCoupon(data);
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw new AppError("Coupon code already exists", 400);
      }
      throw new AppError("Failed to create coupon", 500);
    }
  }

  async updateCouponStatus(id: string, isActive: boolean) {
    if (!id) throw new AppError("Missing ID", 400);
    return adminRepository.updateCouponStatus(id, isActive);
  }

  async deleteCoupon(id: string) {
    if (!id) throw new AppError("Missing ID", 400);
    return adminRepository.deleteCoupon(id);
  }

  // --- Reviews ---
  async getReviews() {
    return adminRepository.getReviews();
  }

  async updateReviewStatus(id: string, status: ReviewStatus) {
    if (!id || !status) throw new AppError("Missing data", 400);
    return adminRepository.updateReviewStatus(id, status);
  }

  // --- Shipping ---
  async getShippingRates() {
    return adminRepository.getShippingRates();
  }

  async upsertShippingRate(district: string, baseRate: number, perItemRate: number) {
    if (!district || baseRate === undefined || perItemRate === undefined) {
      throw new AppError("Missing required fields", 400);
    }
    return adminRepository.upsertShippingRate(district, baseRate, perItemRate);
  }

  async deleteShippingRate(id: string) {
    if (!id) throw new AppError("Missing ID", 400);
    return adminRepository.deleteShippingRate(id);
  }

  // --- Shipping Type Rates (Nationwide) ---
  private static ALLOWED_SHIPPING_TYPES = ['small_1', 'small_2', 'medium', 'large', 'bulky'];

  async getShippingTypeRates() {
    return adminRepository.getShippingTypeRates();
  }

  async upsertShippingTypeRate(shippingType: string, baseRate: number, additionalRate: number) {
    if (!shippingType || baseRate === undefined || additionalRate === undefined) {
      throw new AppError("Missing required fields", 400);
    }
    if (!AdminService.ALLOWED_SHIPPING_TYPES.includes(shippingType)) {
      throw new AppError(`Invalid shipping type: ${shippingType}. Allowed: ${AdminService.ALLOWED_SHIPPING_TYPES.join(', ')}`, 400);
    }
    return adminRepository.upsertShippingTypeRate(shippingType, baseRate, additionalRate);
  }

  // --- Settings ---
  async updateStoreSettings(delayHours: number, discountPercent: number) {
    const existing = await adminRepository.getStoreSettings();
    if (existing) {
      return adminRepository.updateStoreSettings(existing.id, {
        abandonedCartDelayHours: delayHours,
        abandonedCartDiscountPercent: discountPercent
      });
    } else {
      return adminRepository.createStoreSettings({
        abandonedCartDelayHours: delayHours,
        abandonedCartDiscountPercent: discountPercent
      });
    }
  }

  async toggleMaintenanceMode(status: boolean) {
    const existing = await adminRepository.getStoreSettings();
    if (existing) {
      return adminRepository.updateStoreSettings(existing.id, { maintenanceMode: status });
    } else {
      return adminRepository.createStoreSettings({ maintenanceMode: status });
    }
  }
}

export const adminService = new AdminService();
