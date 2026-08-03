import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils';
import { ResetPasswordSchema } from '@/validations/auth.schema';
import { AuthService } from '@/services/auth.service';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = ResetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  try {
    await AuthService.resetPassword(parsed.data.token, parsed.data.newPassword);
    return successResponse(null, 'Password updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Invalid or expired token', 400);
  }
});
