import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { RegisterSchema } from '@/validations/auth.schema';
import { AuthService } from '@/services/auth.service';
import { FeatureFlags } from '@/lib/flags';

export const POST = withErrorHandler(async (req: NextRequest) => {
  if (!FeatureFlags.isEnabled('ENABLE_REGISTRATION')) {
    return errorResponse('Registration is currently disabled', 403);
  }

  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  try {
    await AuthService.register({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      phone: parsed.data.phone,
    });

    // Enumeration protection: always return a generic success
    return successResponse(null, 'If the email is valid, a verification link has been sent.');
  } catch (error: any) {
    // If it's a known error like "Registration failed", we still return a generic success
    // to prevent email enumeration, but we can log the real error if we want.
    return successResponse(null, 'If the email is valid, a verification link has been sent.');
  }
});
