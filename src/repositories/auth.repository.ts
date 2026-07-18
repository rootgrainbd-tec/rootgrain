import "server-only";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class AuthRepository {
  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
  }

  static async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  }

  static async updateUserPassword(email: string, hashedPassword: string) {
    return prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  static async linkGuestOrdersToUser(email: string, userId: string) {
    return prisma.$executeRaw`
      UPDATE "Order"
      SET "userId" = ${userId}
      WHERE "userId" IS NULL 
      AND "shippingAddress"->>'email' = ${email}
    `;
  }

  static async getResetToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
    });
  }

  static async createResetToken(email: string, token: string, expiresAt: Date) {
    return prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });
  }

  static async deleteResetTokensByEmail(email: string) {
    return prisma.passwordResetToken.deleteMany({
      where: { email },
    });
  }

  static async deleteResetTokenById(id: string) {
    return prisma.passwordResetToken.delete({
      where: { id },
    });
  }
}
