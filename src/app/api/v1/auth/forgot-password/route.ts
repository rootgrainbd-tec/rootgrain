import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { ForgotPasswordSchema } from '@/validations/auth.schema';
import { AuthService } from '@/services/auth.service';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = ForgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  await AuthService.initiatePasswordReset(parsed.data.email);

  // Enumeration protection: always return generic response
  return successResponse(null, 'If an account exists, an email will be sent.');
});
