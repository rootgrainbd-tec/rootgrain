import "server-only";
import { InquiryRepository } from "@/repositories/inquiry.repository";
import { AppError } from "@/lib/errors/AppError";
import { logger } from "@/lib/logger";

export class InquiryService {
  static async createInquiry(data: {
    name?: string;
    phone?: string;
    message?: string;
    productId?: string | null;
  }) {
    if (!data.name || !data.phone || !data.message) {
      throw new AppError("Missing required fields", 400);
    }

    return InquiryRepository.create({
      name: data.name,
      phone: data.phone,
      message: data.message,
      productId: data.productId,
    });
  }

  static async updateInquiryStatus(id: string, status: string) {
    if (!id || !status) {
      throw new AppError("Missing required fields", 400);
    }

    try {
      return await InquiryRepository.updateStatus(id, status);
    } catch (error) {
      logger.error({ err: error, inquiryId: id }, "Failed to update inquiry status");
      if ((error as any).code === 'P2025') {
        throw new AppError("Inquiry not found", 404);
      }
      throw new AppError("Failed to update inquiry", 500);
    }
  }
}
