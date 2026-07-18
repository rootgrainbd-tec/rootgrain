import { userRepository } from "@/repositories/user.repository";
import { AppError } from "@/lib/errors/AppError";
import bcrypt from "bcryptjs";

export class UserService {
  // --- Profile ---
  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    if (!userId) throw new AppError("Missing User ID", 401);
    return userRepository.updateProfile(userId, data);
  }

  async getAddresses(userId: string) {
    if (!userId) throw new AppError("Missing User ID", 401);
    return userRepository.getAddresses(userId);
  }

  async createAddress(
    userId: string,
    data: {
      name?: string;
      phone: string;
      division: string;
      district: string;
      street: string;
      postCode?: string;
      isDefault?: boolean;
    }
  ) {
    if (!userId) throw new AppError("Missing User ID", 401);
    if (!data.phone || !data.division || !data.district || !data.street) {
      throw new AppError("Missing required address fields", 400);
    }
    return userRepository.createAddress(userId, data);
  }

  async updateAddress(
    id: string,
    userId: string,
    data: {
      name?: string;
      phone?: string;
      division?: string;
      district?: string;
      street?: string;
      postCode?: string;
      isDefault?: boolean;
    }
  ) {
    if (!id || !userId) throw new AppError("Missing ID or User ID", 400);
    
    try {
      return await userRepository.updateAddress(id, userId, data);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError("Address not found or access denied", 404);
      }
      throw new AppError("Failed to update address", 500);
    }
  }

  async deleteAddress(id: string, userId: string) {
    if (!id || !userId) throw new AppError("Missing ID or User ID", 400);
    
    try {
      return await userRepository.deleteAddress(id, userId);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError("Address not found or access denied", 404);
      }
      throw new AppError("Failed to delete address", 500);
    }
  }

  // --- Wishlist ---
  async getWishlist(userId: string) {
    if (!userId) throw new AppError("Missing User ID", 401);
    return userRepository.getWishlist(userId);
  }

  async addWishlistItem(userId: string, productId: string) {
    if (!userId) throw new AppError("Missing User ID", 401);
    if (!productId) throw new AppError("Missing productId", 400);

    try {
      return await userRepository.addWishlistItem(userId, productId);
    } catch (error) {
      throw new AppError("Failed to add to wishlist", 500);
    }
  }

  async removeWishlistItem(id: string, userId: string) {
    if (!id || !userId) throw new AppError("Missing ID or User ID", 400);
    
    try {
      return await userRepository.removeWishlistItem(id, userId);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError("Wishlist item not found or access denied", 404);
      }
      throw new AppError("Failed to remove from wishlist", 500);
    }
  }

  // --- Account Security ---
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!userId) throw new AppError("Missing User ID", 401);
    if (!currentPassword || !newPassword) {
      throw new AppError("Missing required fields", 400);
    }
    if (newPassword.length < 6) {
      throw new AppError("New password must be at least 6 characters", 400);
    }

    const user = await userRepository.findUserWithPassword(userId);

    if (!user || !user.password) {
      throw new AppError("Password change is not available for this account", 400);
    }

    const isCorrectPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isCorrectPassword) {
      throw new AppError("Password change failed", 400);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(userId, hashedNewPassword);
  }
}
export const userService = new UserService();
