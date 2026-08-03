import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { getSessionToken, clearSessionCookie } from '@/lib/auth/cookies';
import { SessionService } from '@/services/session.service';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const token = await getSessionToken();
  
  if (!token) {
    return errorResponse('Not authenticated', 401);
  }
  
  const session = await SessionService.validateSession(token);

  if (!session) {
    // Invalid or expired session, clear the cookie
    await clearSessionCookie();
    return errorResponse('Session expired or invalid', 401);
  }

  return successResponse({
    isAuthenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
    },
    sessionExpiresAt: session.expires
  });
});
