import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/api-utils';
import { clearSessionCookie, getSessionToken } from '@/lib/auth/cookies';
import { SessionService } from '@/services/session.service';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const token = await getSessionToken();
  
  if (token) {
    // Revoke from database
    await SessionService.revokeSession(token);
  }
  
  // Always clear the cookie (Idempotent)
  await clearSessionCookie();

  return successResponse(null, 'Logged out successfully');
});
