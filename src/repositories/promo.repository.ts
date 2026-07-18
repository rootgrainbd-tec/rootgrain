import "server-only";
import prisma from "@/lib/prisma";

export class PromoRepository {
  static async getPromoByCode(code: string) {
    return prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  static async incrementPromoUsage(id: string) {
    return prisma.promoCode.update({
      where: { id },
      data: { currentUses: { increment: 1 } },
    });
  }
}
