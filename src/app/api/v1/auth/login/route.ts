import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { LoginSchema } from '@/validations/auth.schema';
import { AuthService } from '@/services/auth.service';
import { setSessionCookie } from '@/lib/auth/cookies';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const result = await AuthService.login(
    parsed.data.email,
    parsed.data.password,
    ipAddress,
    userAgent
  );

  if (!result.success || !result.token) {
    // We return 401 for both invalid credentials and lockout, with the generic error message
    return errorResponse(result.error || 'Authentication failed', 401);
  }

  // Set the secure HttpOnly cookie
  await setSessionCookie(result.token, false); // RememberMe can be wired in later if added to LoginSchema

  return successResponse({
    user: {
      id: result.user?.id,
      name: result.user?.name,
      email: result.user?.email,
      emailVerified: result.user?.emailVerified,
    }
  }, 'Logged in successfully');
});
