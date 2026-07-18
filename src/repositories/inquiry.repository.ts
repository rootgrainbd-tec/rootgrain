import "server-only";
import prisma from "@/lib/prisma";

export class InquiryRepository {
  static async create(data: {
    name: string;
    phone: string;
    message: string;
    productId?: string | null;
  }) {
    return prisma.inquiry.create({
      data: {
        name: data.name,
        phone: data.phone,
        message: data.message,
        productId: data.productId || null,
      }
    });
  }

  static async updateStatus(id: string, status: string) {
    return prisma.inquiry.update({
      where: { id },
      data: { status },
    });
  }
}
