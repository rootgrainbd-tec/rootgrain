import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthService } from '@/services/auth.service';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return errorResponse('Not authenticated', 401);

  // Endpoint logic: Resend if not verified
  if (!session.user.emailVerified && session.user.email) {
    await AuthService.sendVerificationEmail(session.user.email);
  }

  // Always return generic success whether it was actually sent or already verified
  return successResponse(null, 'If your account is unverified, a new link has been sent.');
});
