import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });

    if (!user) {
      // Don't reveal if a user exists or not for security reasons
      return NextResponse.json({ success: true, message: "If an account exists, an email will be sent." });
    }

    // Check if the user signed up with an OAuth provider and has no password
    // We can still allow them to reset password, effectively giving them a local password login.
    // Or we could return a specific message. We'll allow it so they can set a password.

    // Generate token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // First, delete any existing token for this email to prevent duplicates
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://rootgrain.bd"}/reset-password?token=${token}`;

    // Send email
    await sendPasswordResetEmail(email, resetLink);

    return NextResponse.json({ success: true, message: "If an account exists, an email will be sent." });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}
