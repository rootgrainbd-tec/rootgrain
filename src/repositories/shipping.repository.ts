import "server-only";
import prisma from "@/lib/prisma";

export class ShippingRepository {
  static async getAllRates() {
    return prisma.shippingRate.findMany({
      orderBy: { district: 'asc' }
    });
  }

  static async getShippingRateByDistrict(district: string) {
    return prisma.shippingRate.findUnique({
      where: { district },
    });
  }
}
