import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 400 });
    }

    // Check if expired
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ success: false, error: "Token has expired. Please request a new one." }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword }
    });

    // Delete the token so it can't be reused
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}
