import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { getSessionToken } from '@/lib/auth/cookies';
import { SessionService } from '@/services/session.service';
import { AuthService } from '@/services/auth.service';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const token = await getSessionToken();
  if (!token) return errorResponse('Not authenticated', 401);
  
  const session = await SessionService.validateSession(token);
  if (!session) return errorResponse('Session expired or invalid', 401);

  // Endpoint logic: Resend if not verified
  if (!session.user.emailVerified && session.user.email) {
    await AuthService.sendVerificationEmail(session.user.email);
  }

  // Always return generic success whether it was actually sent or already verified
  return successResponse(null, 'If your account is unverified, a new link has been sent.');
});
