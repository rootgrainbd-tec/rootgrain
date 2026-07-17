import prisma from "@/lib/prisma";

export const userRepository = {
  updateProfile(userId: string, data: { name?: string; phone?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });
  },

  getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });
  },

  createAddress(
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
    return prisma.address.create({
      data: {
        userId,
        name: data.name || "Home",
        phone: data.phone,
        division: data.division,
        district: data.district,
        street: data.street,
        postCode: data.postCode,
        isDefault: data.isDefault || false,
      },
    });
  },

  updateAddress(
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
    return prisma.address.update({
      where: { id, userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.division !== undefined && { division: data.division }),
        ...(data.district !== undefined && { district: data.district }),
        ...(data.street !== undefined && { street: data.street }),
        ...(data.postCode !== undefined && { postCode: data.postCode }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });
  },

  deleteAddress(id: string, userId: string) {
    return prisma.address.delete({
      where: { id, userId },
    });
  },

  // --- Wishlist ---
  getWishlist(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  addWishlistItem(userId: string, productId: string) {
    return prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId,
          productId
        }
      },
      update: {},
      create: {
        userId,
        productId
      }
    });
  },

  removeWishlistItem(id: string, userId: string) {
    return prisma.wishlist.delete({
      where: { id, userId },
    });
  },

  // --- Account Security ---
  findUserWithPassword(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
  },

  updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
};
